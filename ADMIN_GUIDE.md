# Admin & Verification Workflow Guide

## Overview

This guide explains the admin hierarchy, image and license verification workflows, and super admin management for the Amiy Experts platform.

## Role Hierarchy

### User
- Default role for new accounts
- Can complete purchases and referrals
- Cannot post reviews or consultations

### Doctor
- Verified healthcare professional
- Can post reviews and consultations
- Requires approved avatar + verified license

### Admin
- Can approve user avatars
- Can verify professional licenses
- Can approve/reject reviews
- Cannot create other admins (requires super_admin)

### Super Admin
- Full administrative access
- Can create and manage other super_admins
- Can promote/demote regular admins
- Can approve/reject avatars and licenses
- Can delete user accounts
- Can manage system settings and configurations

## Image & License Verification Workflow

### Step 1: User Uploads Avatar Image

**Location:** User Dashboard → Profile → Change Photo

**Validation (Client-Side):**
- Allowed formats: JPG, JPEG, PNG, WebP
- Maximum file size: 10MB
- Image is automatically compressed and resized to max 2048px dimensions
- Compressed to 80% quality for optimal storage

**Validation (Server-Side):**
- File type verification
- Format re-validation

### Step 2: User Uploads Professional License

**Location:** Doctor Application Form (/doctor-application)

**Validation (Client-Side):**
- Allowed format: PDF only
- Maximum file size: 20MB
- License number is required

**Validation (Server-Side):**
- File type verification (application/pdf)
- Format validation

### Step 3: Admin Reviews in User Management

**Location:** Admin Panel → Users

**Admin sees:**
- User's uploaded avatar image
- Avatar approval status (pending/approved)
- User's uploaded license document
- License verification status (pending/verified)

**Admin Actions:**
- **Approve Avatar:** User can now post reviews
- **Reject Avatar:** User must re-upload photo
- **Verify License:** License is validated and approved
- **Revoke License:** Removes license verification status

### Step 4: User Becomes Doctor

**Requirements (all must be met):**
1. Avatar is approved (`avatar_approved = true`)
2. License is verified (`license_verified = true`)
3. Doctor application is approved (`is_doctor_verified = true`)

**Permissions Granted:**
- Can post reviews and consultations
- Can be referenced as expert in platform
- Eligible for doctor-only benefits and commissions

## Super Admin Management

### Creating Super Admins

**Location:** Admin Panel → Super Admin (only visible to super_admins)

**Requirements:**
- Only existing super_admin can create new super_admins
- Provide email address of new super_admin
- Name is optional

**What happens:**
- New super_admin account is created
- `avatar_approved` is set to true (admins don't need user avatar verification)
- User can immediately access admin panel

```typescript
// Example API call
POST /api/admin/create-super-admin
{
  "email": "newadmin@example.com",
  "name": "Admin Name"
}
```

### Managing Admins

Super admins can promote/demote users to admin role:
- Promote user to admin: Can approve avatars and licenses
- Demote admin to user: Loses all admin privileges

## Image and License Storage

### Upload Flow

1. **Client submits file to upload endpoint:**
   ```
   POST /api/images/upload-url
   { "filename": "profile.jpg" }
   ```

2. **Server generates signed upload URL to Supabase Storage:**
   ```
   Response:
   {
     "uploadUrl": "https://...",
     "key": "uuid-filename",
     "bucket": "user-uploads"
   }
   ```

3. **Client uploads to Supabase directly:**
   ```
   PUT {uploadUrl}
   Body: file data
   ```

4. **Client registers metadata with server:**
   ```
   POST /api/images
   {
     "user_id": "user-uuid",
     "key": "uuid-filename",
     "bucket": "user-uploads"
   }
   ```

5. **Admin retrieves signed view URL:**
   ```
   GET /api/images/signed-url?key=uuid-filename&bucket=user-uploads
   ```

### Storage Security

- Files stored in Supabase Storage (`user-uploads` bucket)
- Access is controlled via Row-Level Security (RLS)
- Each user can only upload to their own directory
- Admins can view files when verifying

## API Endpoints

### User Endpoints

```
GET /api/users/me
- Get current user profile

PUT /api/users/me
- Update user profile
- Body: { name?, email?, clinic?, bio?, avatar?, license_number?, license_url? }
```

### Doctor Application Endpoints

```
POST /api/doctors/apply
- Submit doctor application
- Body: { license_number, license_url, photo_url }

GET /api/doctors/me/application
- Get user's application status
```

### Admin Endpoints (require admin or super_admin role)

```
GET /api/admin/users
- List all users with verification status

POST /api/admin/users/:id/approve-avatar
- Approve user's avatar

POST /api/admin/users/:id/reject-avatar
- Reject user's avatar

POST /api/admin/users/:id/verify-license
- Verify user's professional license

POST /api/admin/users/:id/reject-license
- Revoke user's license verification

POST /api/admin/users/:id/role
- Change user role
- Body: { role: 'user' | 'admin' | 'super_admin' }

POST /api/admin/reviews/:id/approve
- Approve a review

POST /api/admin/create-super-admin
- Create new super admin (super_admin only)
- Body: { email, name? }

DELETE /api/admin/users/:id
- Delete a user (super_admin only)
```

## File Format Requirements

### Avatar Image

| Property | Requirement |
|----------|-------------|
| **Format** | JPG, JPEG, PNG, WebP |
| **Max Size** | 10MB |
| **Dimensions** | Auto-resized to max 2048px |
| **Quality** | Automatically compressed to 80% |
| **Storage** | Supabase Storage (`user-uploads`) |

### Professional License

| Property | Requirement |
|----------|-------------|
| **Format** | PDF only |
| **Max Size** | 20MB |
| **Storage** | Supabase Storage (`user-uploads`) |

## Default Avatar

New users without uploaded avatars display:
- A professional illustrated avatar (doctor with stethoscope)
- Location: `/public/default-avatar.svg`
- Automatically used as fallback in UI

## UI Components

### AvatarUpload Component

Located: `client/components/shared/AvatarUpload.tsx`

Features:
- File validation (format check)
- Client-side image compression
- Error handling with user-friendly messages
- Loading state during compression
- Success feedback

### FileUploader Component

Located: `client/components/shared/FileUploader.tsx`

Features:
- Generic file upload component
- Support for different file types via `fileType` prop
- License validation (PDF only)
- Error handling
- Loading state

### Image Utilities

Located: `client/lib/image-utils.ts`

Functions:
- `validateImage(file)` - Validates image format and size
- `compressImage(file)` - Compresses and resizes images
- `validateLicense(file)` - Validates PDF licenses

## Common Tasks

### Grant Admin Access to a User

1. Navigate to Admin → Users
2. Find the user
3. Click "Promote Admin" button
4. User becomes admin and can approve avatars/licenses

### Approve User Avatar

1. Navigate to Admin → Users
2. Find user with "Avatar: Pending"
3. View avatar by clicking "View Avatar" link
4. Click "Approve Avatar" button
5. User can now post reviews (if license also verified)

### Verify Professional License

1. Navigate to Admin → Users
2. Find user with license uploaded
3. Click "View License" to review PDF
4. Click "Verify License" button
5. User can now participate as doctor expert (if avatar also approved)

### Create New Super Admin

1. Navigate to Admin → Super Admin (visible only if you're super_admin)
2. Enter email address of new super_admin
3. Click "Create Super Admin"
4. New user can now log in and access admin panel
5. New super_admin can create other super_admins

### Remove Admin Privileges

1. Navigate to Admin → Users
2. Find admin user (badge shows "admin")
3. Click "Demote" button
4. User returns to regular "user" role
5. User loses all admin privileges

## Troubleshooting

### "Permission Denied" When Uploading

**Cause:** RLS policies on Supabase not configured for user uploads

**Solution:** 
- Check Supabase RLS policies on `images` table
- Ensure `INSERT` is allowed for authenticated users
- Verify bucket policies allow signed uploads

### Image Compression Not Working

**Cause:** Missing Canvas API support or image corruption

**Solution:**
- User can try different browser
- Reduce image size manually before uploading
- Try JPG format instead of PNG/WebP

### License Verification Stuck

**Cause:** Server-side RLS or policy issue

**Solution:**
- Check Supabase `users` table RLS policies
- Verify `license_verified` column exists and is writable
- Ensure admin user has proper role

## Database Schema

### users table

```sql
- id (UUID, primary key)
- email (text)
- name (text)
- role (text: user, admin, super_admin, doctor)
- avatar_approved (boolean)
- license_verified (boolean)
- license_number (text)
- license_url (text)
- photo_url (text) - user's avatar image URL
- created_at (timestamp)
```

### images table

```sql
- id (UUID, primary key)
- user_id (UUID, foreign key → users)
- key (text) - storage path
- bucket (text) - storage bucket name
- created_at (timestamp)
```

### doctor_applications table

```sql
- id (UUID, primary key)
- user_id (UUID, foreign key → users)
- license_number (text)
- license_url (text)
- photo_url (text)
- status (text: pending, approved, rejected)
- created_at (timestamp)
- reviewed_at (timestamp)
```

## Security Best Practices

1. **Only super_admins can create other super_admins**
   - Prevents privilege escalation
   - Maintains controlled access

2. **Avatar approval before review posting**
   - Ensures platform has verified user identity
   - Prevents fake profiles from posting

3. **License verification for doctor features**
   - Validates professional credentials
   - Ensures expert legitimacy

4. **Direct upload to Supabase Storage**
   - Files don't pass through server
   - Reduces server load
   - Better file security

5. **RLS on all data tables**
   - Users can only see their own data
   - Admins can see verified data
   - Prevents unauthorized access

## Support

For issues or questions about the admin system, refer to:
- Server routes: `server/routes/admin.ts`
- Client API: `client/lib/api.ts`
- Image utilities: `client/lib/image-utils.ts`
- Admin UI: `client/pages/admin/`
