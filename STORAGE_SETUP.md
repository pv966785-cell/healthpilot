# HealthPilot - Firebase Storage Setup Guide

To enable document and report file uploads in HealthPilot, enable **Firebase Storage** in your Firebase Console and publish the security rules.

## Step 1: Enable Firebase Storage in Console
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your Firebase project (`radiant-tenure-nf38q`).
3. In the left navigation bar, go to **Build** > **Storage**.
4. Click **Get Started** and select **Start in production mode**.
5. Choose your default storage bucket location (e.g. `asia-south1` or `us-central1`) and click **Done**.

## Step 2: Publish Storage Security Rules
1. In the Firebase Storage dashboard, click the **Rules** tab.
2. Replace the existing default rules with the contents of `storage.rules` in this project repository:

```rules
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    function isAdmin() {
      return isSignedIn() && 
        request.auth.token.email == 'pv966785@gmail.com' && 
        request.auth.token.email_verified == true;
    }

    function isValidFile() {
      return request.resource.size <= 5 * 1024 * 1024 &&
        (request.resource.contentType.matches('application/pdf') ||
         request.resource.contentType.matches('image/jpeg') ||
         request.resource.contentType.matches('image/jpg') ||
         request.resource.contentType.matches('image/png'));
    }

    // User Profile Documents
    match /users/{uid}/{allPaths=**} {
      allow read: if isOwner(uid) || isAdmin();
      allow write: if isOwner(uid) && isValidFile();
    }

    // Diagnostic Lab Reports
    match /labReports/{bookingId}/{allPaths=**} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && isValidFile();
    }

    // Doctor Digital Prescriptions
    match /prescriptions/{patientId}/{allPaths=**} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && isValidFile();
    }

    // Default deny all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish**.

## Security Overview
- **User Documents** (`/users/{uid}/**`): Owned by `{uid}`. Uploads restricted to signed-in owner (max 5 MB; PDF, JPG, PNG). Readable only by owner and Super Admin (`pv966785@gmail.com`).
- **Lab Reports** (`/labReports/{bookingId}/**`): Read/write restricted to signed-in users.
- **Digital Prescriptions** (`/prescriptions/{patientId}/**`): Read/write restricted to signed-in users.
