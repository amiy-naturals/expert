import { Router, RequestHandler } from 'express';
import { getServerSupabase } from '../lib/supabase';
import { normalizeEmail, normalizePhoneE164 } from '../lib/contacts';
import { getConfig } from '../lib/env';
import { z } from 'zod';

const router = Router();

const captureSchema = z.object({
  referralCode: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
});

/**
 * POST /api/referral-capture
 * Capture a referral lead from a doctor's referral link
 * 
 * Flow:
 * 1. Validate referral code and get doctor ID
 * 2. Save referral_captures record
 * 3. Try to match to existing Shopify customer
 * 4. Link if found, keep pending if not
 */
export const captureReferral: RequestHandler = async (req, res) => {
  try {
    // Ensure body is parsed as JSON (fallback if middleware didn't parse it)
    let body = req.body;

    // If body is a string, parse it as JSON
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({
          message: 'Invalid request: malformed JSON',
        });
      }
    }

    // If body is empty, provide helpful error
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        message: 'Invalid request: empty or invalid body',
      });
    }

    const parsed = captureSchema.safeParse(body);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid request',
        errors: parsed.error.errors,
      });
    }

    const { referralCode, email, phone } = parsed.data;

    // At least one contact field is required
    if (!email && !phone) {
      return res.status(400).json({
        message: 'At least email or phone is required',
      });
    }

    // Parse referral code to get doctor identifier
    // Format: AM-XXXXX where XXXXX is part of email or username
    const codeParts = referralCode.split('-');
    if (codeParts.length !== 2 || codeParts[0] !== 'AM') {
      return res.status(400).json({
        message: 'Invalid referral code format',
      });
    }

    const doctorIdentifier = codeParts[1].toLowerCase();

    // Get Supabase client
    const supabase = getServerSupabase();

    // Find doctor by email prefix or username
    // The referral code is AM-{emailPrefix} where emailPrefix is part before @
    // So we search for emails starting with that prefix
    const { data: doctors, error: doctorError } = await supabase
      .from('users')
      .select('id, name, email, username')
      .or(`email.ilike.${doctorIdentifier}@%,username.ilike.${doctorIdentifier}%`)
      .limit(1);

    if (doctorError) {
      console.error('Doctor lookup error:', doctorError);
      return res.status(500).json({ message: 'Failed to verify referral code' });
    }

    if (!doctors || doctors.length === 0) {
      return res.status(404).json({ message: 'Referral code not found' });
    }

    const doctor = doctors[0];

    // Normalize email and phone for matching
    const emailNorm = email ? normalizeEmail(email) : null;
    const phoneE164 = phone ? normalizePhoneE164(phone) : null;

    // Check if this lead already exists
    let existingCapture = null;
    if (emailNorm) {
      const { data } = await supabase
        .from('referral_captures')
        .select('*')
        .eq('email_normalized', emailNorm)
        .eq('doctor_id', doctor.id)
        .single();
      existingCapture = data;
    }

    if (!existingCapture && phoneE164) {
      const { data } = await supabase
        .from('referral_captures')
        .select('*')
        .eq('phone_e164', phoneE164)
        .eq('doctor_id', doctor.id)
        .single();
      existingCapture = data;
    }

    // Try to match to Shopify customer
    let matchedUserId = null;
    let matchedExternalId = null;
    let shopifyProfile = null;

    try {
      const config = getConfig();

      // Search for customer by email using REST API
      if (emailNorm) {
        const searchQuery = `email:${email}`;
        const params = new URLSearchParams({ query: searchQuery });

        const response = await fetch(
          `https://${config.shopify.domain}/admin/api/${config.shopify.apiVersion}/customers/search.json?${params}`,
          {
            headers: {
              'X-Shopify-Access-Token': config.shopify.adminToken,
            },
          }
        );

        if (response.ok) {
          const data = await response.json() as { customers: Array<{
            id: number;
            email: string;
            first_name?: string;
            last_name?: string;
            phone?: string;
            default_address?: {
              address1?: string;
              address2?: string;
              city?: string;
              province?: string;
              zip?: string;
              country?: string;
            };
          }> };

          if (data.customers && data.customers.length > 0) {
            const customer = data.customers[0];

            // Fetch customer orders to get total spent
            let totalSpent = 0;
            let totalOrders = 0;
            try {
              const ordersResponse = await fetch(
                `https://${config.shopify.domain}/admin/api/${config.shopify.apiVersion}/customers/${customer.id}/orders.json`,
                {
                  headers: {
                    'X-Shopify-Access-Token': config.shopify.adminToken,
                  },
                }
              );

              if (ordersResponse.ok) {
                const ordersData = await ordersResponse.json() as { orders: Array<{ total_price?: string }> };
                totalOrders = ordersData.orders?.length || 0;
                totalSpent = ordersData.orders?.reduce((sum, order) => {
                  return sum + parseFloat(order.total_price || '0');
                }, 0) || 0;
              }
            } catch (orderError) {
              console.error('Error fetching customer orders:', orderError);
            }

            shopifyProfile = {
              name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
              email: customer.email,
              phone: customer.phone,
              address: customer.default_address,
              totalOrders,
              totalSpent,
            };
          }
        }
      }

      // Check if email matches an existing Amiy user
      if (emailNorm) {
        const { data: userByEmail } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single();

        if (userByEmail) {
          matchedUserId = userByEmail.id;
        }
      }

      // Check if matches external customer
      if (phoneE164 || emailNorm) {
        let query = supabase.from('external_customers').select('id');
        if (emailNorm) {
          query = query.eq('email_norm', emailNorm);
        } else if (phoneE164) {
          query = query.eq('phone_e164', phoneE164);
        }

        const { data: externalCustomers } = await query.limit(1);
        if (externalCustomers && externalCustomers.length > 0) {
          matchedExternalId = externalCustomers[0].id;
        }
      }
    } catch (shopifyError) {
      console.error('Shopify lookup error:', shopifyError);
      // Continue without Shopify match
    }

    // Save or update referral capture
    const captureData = {
      doctor_id: doctor.id,
      email: email || null,
      phone: phone || null,
      email_normalized: emailNorm,
      phone_e164: phoneE164,
      source: 'referral_link',
      matched_to_user_id: matchedUserId,
      matched_to_external_customer_id: matchedExternalId,
      status: matchedUserId || matchedExternalId ? 'matched' : 'pending',
      metadata: {
        shopifyProfile: shopifyProfile || null,
        capturedAt: new Date().toISOString(),
        userAgent: req.get('user-agent'),
      },
    };

    let capture;
    if (existingCapture) {
      // Update existing capture
      const { data, error } = await supabase
        .from('referral_captures')
        .update(captureData)
        .eq('id', existingCapture.id)
        .select()
        .single();

      if (error) throw error;
      capture = data;
    } else {
      // Insert new capture
      const { data, error } = await supabase
        .from('referral_captures')
        .insert([captureData])
        .select()
        .single();

      if (error) throw error;
      capture = data;
    }

    return res.status(200).json({
      success: true,
      captureId: capture.id,
      status: capture.status,
      message: matchedUserId
        ? 'Welcome back! Your referral has been linked.'
        : 'Thank you for your interest! We\'ll keep you updated.',
      shopifyProfile: shopifyProfile || null,
    });
  } catch (error) {
    console.error('Referral capture error:', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to capture referral',
    });
  }
};

router.post('/', captureReferral);

export default router;
