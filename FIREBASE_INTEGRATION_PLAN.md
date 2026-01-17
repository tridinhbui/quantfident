# 🚀 FIREBASE/FIRESTORE INTEGRATION PLAN

*Complete implementation guide for admin system*

---

## **📋 IMPLEMENTATION ROADMAP**

### **Phase 1: Firebase Infrastructure Setup (Week 1)**
### **Phase 2: Authentication & User Management (Week 2)**
### **Phase 3: Admin Approval System (Week 3)**
### **Phase 4: Content Management (Week 4)**
### **Phase 5: Production Deployment (Week 5)**

---

## **🔧 PHASE 1: FIREBASE INFRASTRUCTURE SETUP**

### **1.1 Firebase Project Setup**
```bash
# 1. Go to https://console.firebase.google.com
# 2. Create project: "quantfident-prod"
# 3. Enable Authentication > Email/Password
# 4. Enable Firestore Database (start in test mode)
# 5. Create Web App > Get config
```

### **1.2 Environment Variables**
```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=quantfident-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=quantfident-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=quantfident-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Server-side (Vercel)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### **1.3 Firebase Client Setup**
```typescript
// src/lib/firebase/client.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### **1.4 Firebase Admin SDK Setup**
```typescript
// src/lib/firebase/admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
```

---

## **🔐 PHASE 2: AUTHENTICATION & USER MANAGEMENT**

### **2.1 Enhanced Auth Types**
```typescript
// src/types/user.ts
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  photoURL?: string;

  // Account status
  emailVerified: boolean;
  disabled: boolean;

  // Activity tracking
  createdAt: Date;
  lastLoginAt: Date;
  totalLogins: number;

  // Admin application (if role = 'user')
  adminApplication?: AdminApplication;
}

export interface AdminApplication {
  appliedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  requiredApprovals: number;
  approvedBy: string[]; // Array of admin UIDs
  approvedAt?: Date;
  rejectedReason?: string;
}
```

### **2.2 Enhanced Auth Helpers**
```typescript
// src/lib/firebase/auth.ts
import { auth, db } from './client';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

export class AuthService {
  static async signUp(email: string, password: string, displayName: string) {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name
      await updateProfile(userCredential.user, { displayName });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName,
        role: 'user',
        emailVerified: false,
        disabled: false,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        totalLogins: 1,
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: this.handleAuthError(error) };
    }
  }

  static async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Update login stats in Firestore
      const userRef = doc(db, 'users', userCredential.user.uid);
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        totalLogins: increment(1),
      });

      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: this.handleAuthError(error) };
    }
  }

  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate(),
          lastLoginAt: data.lastLoginAt?.toDate(),
          adminApplication: data.adminApplication ? {
            ...data.adminApplication,
            appliedAt: data.adminApplication.appliedAt?.toDate(),
            approvedAt: data.adminApplication.approvedAt?.toDate(),
          } : undefined,
        } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }
}
```

### **2.3 Auth Context Provider**
```typescript
// src/components/providers/auth-provider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { AuthService } from '@/lib/firebase/auth';
import type { UserProfile } from '@/types/user';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (firebaseUser) {
      const profile = await AuthService.getUserProfile(firebaseUser.uid);
      setUser(profile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        const profile = await AuthService.getUserProfile(firebaseUser.uid);
        setUser(profile);
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {AuthContext.Provider}
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## **👑 PHASE 3: ADMIN APPROVAL SYSTEM**

### **3.1 Admin Service**
```typescript
// src/lib/services/admin-service.ts
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase-admin/firestore';

export class AdminService {
  static async applyForAdmin(applicantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const applicantRef = doc(adminDb, 'users', applicantId);
      const applicant = await getDoc(applicantRef);

      if (!applicant.exists()) {
        return { success: false, error: 'User not found' };
      }

      const userData = applicant.data();

      // Check eligibility (2 weeks + activity)
      const accountAge = Date.now() - userData.createdAt.toMillis();
      const twoWeeks = 14 * 24 * 60 * 60 * 1000;

      if (accountAge < twoWeeks) {
        return { success: false, error: 'Account too new' };
      }

      // Create application
      await updateDoc(applicantRef, {
        adminApplication: {
          appliedAt: serverTimestamp(),
          status: 'pending',
          requiredApprovals: 3,
          approvedBy: [],
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error applying for admin:', error);
      return { success: false, error: 'Failed to apply' };
    }
  }

  static async approveAdminApplication(adminId: string, applicantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify admin
      const adminRef = doc(adminDb, 'users', adminId);
      const admin = await getDoc(adminRef);

      if (!admin.exists() || admin.data().role !== 'admin') {
        return { success: false, error: 'Unauthorized' };
      }

      const applicantRef = doc(adminDb, 'users', applicantId);
      const applicant = await getDoc(applicantRef);

      if (!applicant.exists()) {
        return { success: false, error: 'Applicant not found' };
      }

      const application = applicant.data().adminApplication;

      if (!application || application.status !== 'pending') {
        return { success: false, error: 'Invalid application' };
      }

      // Check if admin already approved
      if (application.approvedBy.includes(adminId)) {
        return { success: false, error: 'Already approved' };
      }

      const newApprovedBy = [...application.approvedBy, adminId];

      if (newApprovedBy.length >= application.requiredApprovals) {
        // Enough approvals - promote to admin
        await updateDoc(applicantRef, {
          role: 'admin',
          'adminApplication.status': 'approved',
          'adminApplication.approvedBy': newApprovedBy,
          'adminApplication.approvedAt': serverTimestamp(),
        });

        // Set custom claims
        await adminAuth.setCustomUserClaims(applicantId, {
          role: 'admin'
        });

        // Log promotion
        await this.logAdminAction(adminId, 'PROMOTE_USER', {
          targetUserId: applicantId,
          newRole: 'admin'
        });

      } else {
        // Not enough approvals yet
        await updateDoc(applicantRef, {
          'adminApplication.approvedBy': newApprovedBy
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error approving admin application:', error);
      return { success: false, error: 'Approval failed' };
    }
  }

  private static async logAdminAction(adminId: string, action: string, data: any) {
    await adminDb.collection('adminLogs').add({
      adminId,
      action,
      data,
      timestamp: serverTimestamp(),
    });
  }
}
```

### **3.2 Admin Application Component**
```typescript
// src/components/admin/applications/application-list.tsx
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { AdminService } from '@/lib/services/admin-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Application {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  appliedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: string[];
  requiredApprovals: number;
}

export function ApplicationList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('adminApplication.status', '==', 'pending'),
      orderBy('adminApplication.appliedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        appliedAt: doc.data().adminApplication?.appliedAt?.toDate(),
        approvedBy: doc.data().adminApplication?.approvedBy || [],
        requiredApprovals: doc.data().adminApplication?.requiredApprovals || 3,
      })) as Application[];

      setApplications(apps);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleApprove = async (applicationId: string) => {
    try {
      await AdminService.approveAdminApplication(currentUserId, applicationId);
      // UI will update automatically via onSnapshot
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Admin Applications ({applications.length})</h2>

      {applications.map((app) => (
        <div key={app.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{app.displayName}</h3>
              <p className="text-sm text-gray-600">{app.email}</p>
              <p className="text-xs text-gray-500">
                Applied: {app.appliedAt.toLocaleDateString()}
              </p>
            </div>

            <div className="text-right">
              <Badge variant="outline">
                {app.approvedBy.length}/{app.requiredApprovals} approvals
              </Badge>
              <div className="mt-2">
                <Button
                  size="sm"
                  onClick={() => handleApprove(app.id)}
                  disabled={app.approvedBy.includes(currentUserId)}
                >
                  {app.approvedBy.includes(currentUserId) ? 'Approved' : 'Approve'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### **3.3 Apply for Admin Component**
```typescript
// src/components/admin/apply-for-admin.tsx
"use client";

import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { AdminService } from '@/lib/services/admin-service';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ApplyForAdmin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleApply = async () => {
    if (!user) return;

    setLoading(true);
    setMessage('');

    try {
      const result = await AdminService.applyForAdmin(user.uid);

      if (result.success) {
        setMessage('Application submitted successfully!');
      } else {
        setMessage(result.error || 'Application failed');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Check eligibility
  const isEligible = user && (
    Date.now() - user.createdAt.getTime() > 14 * 24 * 60 * 60 * 1000 && // 2 weeks
    user.totalLogins >= 10 // Minimum activity
  );

  if (!isEligible) {
    return (
      <Alert>
        <AlertDescription>
          You need at least 2 weeks of activity and 10 logins to apply for admin.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Apply for Admin</h3>
      <p className="text-sm text-gray-600">
        Become an admin to help manage the community. Requires 3 admin approvals.
      </p>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleApply}
        disabled={loading || !!user.adminApplication}
      >
        {loading ? 'Applying...' :
         user.adminApplication ? 'Application Pending' :
         'Apply for Admin'}
      </Button>
    </div>
  );
}
```

---

## **📝 PHASE 4: FIRESTORE SECURITY RULES**

### **4.1 Comprehensive Security Rules**
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection - complex rules
    match /users/{userId} {
      // Users can read their own profile
      allow read: if request.auth != null && request.auth.uid == userId;

      // Users can update limited fields of their own profile
      allow update: if request.auth != null && request.auth.uid == userId &&
        // Only allow safe updates
        !request.resource.data.diff(resource.data).affectedKeys()
         .hasAny(['role', 'adminApplication', 'disabled']);

      // Admin can read all users
      allow read: if isAdmin();

      // Admin can update user roles and admin applications
      allow update: if isAdmin() &&
        // Only admins can change these fields
        request.resource.data.diff(resource.data).affectedKeys()
         .hasAny(['role', 'adminApplication', 'disabled']);
    }

    // Admin-only collections
    match /admin/{document=**} {
      allow read, write: if isAdmin();
    }

    // Public content
    match /posts/{postId} {
      // Anyone can read published posts
      allow read: if resource.data.status == 'published' || isAdmin();

      // Authenticated users can create posts
      allow create: if request.auth != null;

      // Authors and admins can update posts
      allow update: if isAdmin() ||
        (request.auth != null && request.auth.uid == resource.data.authorId);

      // Only admins can delete posts
      allow delete: if isAdmin();
    }

    // Admin logs (append-only)
    match /adminLogs/{logId} {
      allow read: if isAdmin();
      allow create: if isAdmin();
      // No updates or deletes for audit trail
    }
  }

  // Helper functions
  function isAdmin() {
    return request.auth != null &&
      exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  }
}
```

---

## **🗂️ PHASE 5: DATABASE SCHEMA & INDEXES**

### **5.1 Firestore Indexes**
```json
// firebase.json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": [
      {
        "collectionGroup": "users",
        "queryScope": "COLLECTION",
        "fields": [
          { "fieldPath": "role", "order": "ASCENDING" },
          { "fieldPath": "createdAt", "order": "DESCENDING" }
        ]
      },
      {
        "collectionGroup": "users",
        "queryScope": "COLLECTION",
        "fields": [
          { "fieldPath": "adminApplication.status", "order": "ASCENDING" },
          { "fieldPath": "adminApplication.appliedAt", "order": "DESCENDING" }
        ]
      },
      {
        "collectionGroup": "posts",
        "queryScope": "COLLECTION",
        "fields": [
          { "fieldPath": "status", "order": "ASCENDING" },
          { "fieldPath": "createdAt", "order": "DESCENDING" }
        ]
      }
    ]
  }
}
```

### **5.2 Data Migration Script**
```typescript
// scripts/migrate-existing-users.ts
import { adminDb } from '@/lib/firebase/admin';

async function migrateExistingUsers() {
  const usersRef = adminDb.collection('users');
  const snapshot = await usersRef.get();

  const batch = adminDb.batch();

  snapshot.forEach((doc) => {
    const userData = doc.data();

    // Add missing fields for existing users
    const updates: any = {};

    if (!userData.role) updates.role = 'user';
    if (!userData.createdAt) updates.createdAt = admin.firestore.FieldValue.serverTimestamp();
    if (!userData.lastLoginAt) updates.lastLoginAt = admin.firestore.FieldValue.serverTimestamp();
    if (!userData.totalLogins) updates.totalLogins = 1;

    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, updates);
    }
  });

  await batch.commit();
  console.log('Migration completed');
}
```

---

## **🔄 PHASE 6: API ROUTES**

### **6.1 Admin API Routes**
```typescript
// src/app/api/admin/applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/admin-service';
import { verifyAdminSession } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, applicantId } = await request.json();

    if (action === 'approve') {
      const result = await AdminService.approveAdminApplication(session.uid, applicantId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

### **6.2 User Application Route**
```typescript
// src/app/api/admin/apply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/admin-service';
import { verifyUserSession } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await verifyUserSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await AdminService.applyForAdmin(session.uid);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

---

## **🧪 TESTING STRATEGY**

### **7.1 Unit Tests**
```typescript
// __tests__/services/admin-service.test.ts
describe('AdminService', () => {
  it('should approve admin application with 3 approvals', async () => {
    // Mock Firestore calls
    // Test approval logic
  });

  it('should reject ineligible admin applications', async () => {
    // Test eligibility checks
  });
});
```

### **7.2 Integration Tests**
```typescript
// __tests__/admin-flow.test.ts
describe('Admin Application Flow', () => {
  it('should complete full admin application process', async () => {
    // Create user → Apply → 3 approvals → Become admin
  });
});
```

### **7.3 E2E Tests**
```typescript
// e2e/admin-application.spec.ts
test('user can apply for admin and get approved', async ({ page }) => {
  // Login as user → Apply for admin → Login as admin → Approve
});
```

---

## **🚀 DEPLOYMENT CHECKLIST**

### **Production Setup:**
- ✅ Firebase project in production mode
- ✅ Firestore security rules deployed
- ✅ Indexes created
- ✅ Environment variables configured in Vercel
- ✅ Service account key set up
- ✅ Data migration completed

### **Monitoring:**
- ✅ Firebase Analytics enabled
- ✅ Error tracking (Sentry)
- ✅ Performance monitoring
- ✅ Admin activity logging

---

## **🎯 SUCCESS METRICS**

- **User Registration:** 1000+ users
- **Admin Applications:** 50+ applications processed
- **Approval Rate:** 80% approval rate
- **System Uptime:** 99.9%
- **Response Time:** <500ms for all operations

---

**This plan provides a complete, production-ready Firebase/Firestore integration with admin management system. Ready to implement! 🚀**

