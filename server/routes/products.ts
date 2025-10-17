import { Router } from "express";
import { getProductByHandle, listProducts } from "../lib/shopify";
import { sendError } from '../lib/error';

const router = Router();

// Simple in-memory cache to reduce Shopify API pressure (helps when DevTools disables cache)
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { ts: number; value: any }>();

router.get("/", async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const pageInfo = typeof req.query.pageInfo === "string" ? req.query.pageInfo : undefined;
    const collectionId = req.query.collectionId
      ? Number(req.query.collectionId)
      : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : "active";

    const key = JSON.stringify({ limit, pageInfo, collectionId, status });
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && now - cached.ts < CACHE_TTL_MS) {
      return res.json(cached.value);
    }

    const { products, nextPageInfo, prevPageInfo } = await listProducts({
      limit,
      pageInfo,
      collectionId,
      status: status as "active" | "draft" | "archived",
    });

    const payload = products.map((product) => ({
      id: product.id,
      handle: product.handle,
      title: product.title,
      descriptionHtml: product.body_html,
      status: product.status,
      vendor: product.vendor,
      productType: product.product_type,
      tags:
        typeof product.tags === "string"
          ? product.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : product.tags,
      images: product.images.map((img) => ({
        id: img.id,
        src: img.src,
        alt: img.alt ?? null,
      })),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        title: variant.title,
        price: Number(variant.price),
        compareAtPrice: variant.compare_at_price
          ? Number(variant.compare_at_price)
          : null,
        sku: variant.sku ?? null,
        inventoryQuantity: variant.inventory_quantity ?? null,
        requiresShipping: variant.requires_shipping ?? true,
      })),
      defaultPrice: product.variants[0]
        ? Number(product.variants[0].price)
        : undefined,
      compareAtPrice: product.variants[0]?.compare_at_price
        ? Number(product.variants[0].compare_at_price!)
        : undefined,
    }));

    const response = {
      products: payload,
      nextPageInfo,
      prevPageInfo,
    };
    cache.set(key, { ts: now, value: response });

    res.json(response);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

router.get("/:handle", async (req, res) => {
  try {
    const product = await getProductByHandle(req.params.handle);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const payload = {
      id: product.id,
      handle: product.handle,
      title: product.title,
      descriptionHtml: product.body_html,
      status: product.status,
      vendor: product.vendor,
      productType: product.product_type,
      tags:
        typeof product.tags === "string"
          ? product.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : product.tags,
      images: product.images.map((img) => ({
        id: img.id,
        src: img.src,
        alt: img.alt ?? null,
      })),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        title: variant.title,
        price: Number(variant.price),
        compareAtPrice: variant.compare_at_price
          ? Number(variant.compare_at_price)
          : null,
        sku: variant.sku ?? null,
        inventoryQuantity: variant.inventory_quantity ?? null,
        requiresShipping: variant.requires_shipping ?? true,
      })),
    };
    res.json(payload);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

export default router;
