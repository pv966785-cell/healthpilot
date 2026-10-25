# HealthPilot - Admin Setup & Firestore Security Guide

## Super Admin Credentials
- **Authorized Email:** `pv966785@gmail.com`
- **Requirement:** The Google or Email/Password account must be verified (`email_verified == true`).
- **Permissions:** Full read and write access across all platform collections (`users`, `appointments`, `labBookings`, `pharmacyOrders`, `auditLogs`, `supportTickets`, `uniqueKeys`, `healthRecords`, `pharmacyInventory`).

---

## Deploying Firestore Security Rules

The security rules in `firestore.rules` protect all platform collections while granting unrestricted administrative access to the Super Admin.

### Named Firestore Database Config
From `firebase-applet-config.json`:
- **Project ID:** `radiant-tenure-nf38q`
- **Database ID:** `ai-studio-medicareone-247e43c9-4122-4093-901d-1c5eadfd2559`

### Publishing Rules via AI Studio
In this environment, rules are automatically built and deployed via the `DeployRules` RPC tool.

### Publishing Rules via Firebase CLI (Manual Deployment)
To deploy the rules directly using the Firebase CLI:

1. Ensure the Firebase CLI is installed and logged in:
   ```bash
   firebase login
   ```

2. Select your Firebase Project:
   ```bash
   firebase use radiant-tenure-nf38q
   ```

3. Deploy rules specifically to the named Firestore database instance:
   ```bash
   firebase deploy --only firestore:rules
   ```
   *Note: If targeting the named database instance explicitly:*
   ```bash
   firebase deploy --only firestore:rules --database ai-studio-medicareone-247e43c9-4122-4093-901d-1c5eadfd2559
   ```

---

## Super Admin Features
1. **Omniscience Data Visibility:** Complete access to all patients, doctors, pharmacies, labs, appointments, lab bookings, medicine orders, and payment records.
2. **Audit Trail Logging:** Automatic non-blocking audit logs (`logAudit`) whenever administrative views, user profile Inspections, or CSV data exports occur.
3. **Data Masking Toggle:** Quick toggle in the header for DPDP Act compliance when demonstrating the application.
