# Firebase Console Login Setup for HealthPilot

Project ID: `radiant-tenure-nf38q`
Database ID: `ai-studio-medicareone-247e43c9-4122-4093-901d-1c5eadfd2559`

1. **Authentication -> Sign-in method**:
   - Ensure **Email/Password** is enabled (Allow users to sign up using their email address and password).
   - Ensure **Google** is enabled (with project support email configured).

2. **Authentication -> Settings -> Authorized domains**:
   Add the following domains:
   - `ais-dev-733b3vfqt2irbpxomeo4zl-332190859211.asia-southeast1.run.app`
   - `ais-pre-733b3vfqt2irbpxomeo4zl-332190859211.asia-southeast1.run.app`
   - `localhost`

3. **Firestore Database**:
   - Database named `ai-studio-medicareone-247e43c9-4122-4093-901d-1c5eadfd2559` has been provisioned and `firestore.rules` deployed.

4. **Super Admin Access**:
   - Admin email: `pv966785@gmail.com`
   - Once signed in or created with this email in Firebase Authentication, full platform access to User Directory, Approval Queue, and Surveillance is granted.
