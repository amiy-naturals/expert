# Quick Start Guide - Admin & Verification System

## 🚀 What's New

### For Users
- **New Avatar Upload** - Upload JPG, JPEG, PNG, or WebP images (automatically compressed)
- **Doctor Application** - Submit professional license (PDF) and photo at `/doctor-application`
- **Better Default Avatar** - Professional doctor illustration while avatar is pending

### For Admins
- **User Management Dashboard** - Approve/reject avatars and verify licenses
- **Clear Status Badges** - See who needs approval and who's verified
- **Super Admin Panel** - Create and manage other super admins

---

## 📍 Where to Find Things

### User Features
| Action | Location |
|--------|----------|
| Upload Profile Photo | Dashboard → Profile → Change Photo |
| Submit Doctor Application | `/doctor-application` |
| View my approval status | Dashboard → Profile |

### Admin Features
| Action | Location |
|--------|----------|
| Manage Users | Admin → Users |
| Approve Avatars | Admin → Users → [User] → Approve Avatar |
| Verify Licenses | Admin → Users → [User] → Verify License |
| Create Super Admin | Admin → Super Admin (super_admin only) |

---

## 🔐 File Formats

### Avatar Image ✅
```
✓ Formats: JPG, JPEG, PNG, WebP
✓ Max Size: 10MB
✓ Auto-compressed: 80% quality
✓ Auto-resized: max 2048px
```

### Professional License ✅
```
✓ Format: PDF only
✓ Max Size: 20MB
✓ License Number: Required
```

---

## 👥 User Roles

### Super Admin
- Create other super admins
- Promote/demote admins
- Delete users
- Manage all approvals

### Admin
- Approve avatars
- Verify licenses
- Approve reviews
- Cannot create other admins

### Doctor
- Post reviews/consultations
- Requires: approved avatar + verified license

### User
- Default role
- Can purchase/refer
- Cannot post reviews yet

---

## ✅ Verification Checklist

For a user to become a **Doctor** and post reviews:

- [ ] Avatar uploaded and **Approved by Admin**
- [ ] License submitted as PDF
- [ ] License **Verified by Admin**
- [ ] Doctor application approved

Once all checked ✓, user can:
- Post reviews and consultations
- Be referenced as expert
- Access doctor-only features

---

## 🎯 Common Tasks

### Approve User Avatar (Admin)
```
1. Admin → Users
2. Find user with "Avatar: Pending"
3. Click "View Avatar" to preview
4. Click "Approve Avatar" button
```

### Verify Professional License (Admin)
```
1. Admin → Users
2. Find user with license uploaded
3. Click "View License" to review PDF
4. Click "Verify License" button
```

### Create New Super Admin (Super Admin Only)
```
1. Admin → Super Admin
2. Enter email address
3. Click "Create Super Admin"
4. New super admin can immediately log in
```

### Promote User to Admin (Super Admin)
```
1. Admin → Users
2. Find user to promote
3. Click "Promote Admin" button
4. User now has admin privileges
```

### Revoke User Approval (Admin)
```
1. Admin → Users
2. Find approved user
3. Click "Reject Avatar" or "Revoke License"
4. User status reset to pending
```

---

## 🔗 Key Files

| File | Purpose |
|------|---------|
| `client/lib/image-utils.ts` | Image/license validation & compression |
| `client/pages/DoctorApplication.tsx` | Doctor application form |
| `client/pages/admin/Users.tsx` | Admin user management |
| `client/pages/admin/SuperAdmin.tsx` | Super admin creation |
| `server/routes/admin.ts` | Backend verification endpoints |
| `ADMIN_GUIDE.md` | Full documentation |

---

## 🚨 Troubleshooting

### Avatar Upload Fails
- ✓ Check file format (must be JPG, JPEG, PNG, or WebP)
- ✓ Check file size (max 10MB)
- ✓ Try different browser if compression fails

### License Upload Fails
- ✓ Check file is PDF format
- ✓ Check file size (max 20MB)
- ✓ Ensure license number is filled in

### Can't Access Admin Panel
- ✓ Check you're logged in
- ✓ Check your role is `admin` or `super_admin`
- ✓ Try logging out and back in

### Can't Create Super Admin
- ✓ Only super_admins can create super_admins
- ✓ Regular admins cannot create other admins
- ✓ Check you're viewing Admin → Super Admin page

---

## 📊 Database Fields

Users table includes:
- `avatar_approved` - Boolean (admin approval status)
- `license_verified` - Boolean (license verification status)
- `license_number` - Text (medical license number)
- `license_url` - Text (stored PDF URL)
- `photo_url` - Text (user's avatar image)
- `role` - Text (user, admin, super_admin, doctor)

---

## 🔒 Security Notes

✅ Images validated on client AND server
✅ PDFs must be actual PDF files
✅ File types checked by extension AND MIME type
✅ All files stored securely in Supabase Storage
✅ Signed URLs expire after 1 hour
✅ Super admins can only be created by other super admins
✅ RLS policies prevent unauthorized access

---

## 📞 Support

For detailed information, see:
- **Full Guide:** `ADMIN_GUIDE.md`
- **Implementation:** `IMPLEMENTATION_SUMMARY.md`
- **Code:** Check files in `server/routes/admin.ts` and `client/pages/admin/`

---

## 🎉 Ready to Go!

The system is now ready for:
- Users to upload avatars and submit doctor applications
- Admins to review and approve credentials
- Super admins to manage the entire team

Start by creating your first super admin at `/admin/super-admin`!
