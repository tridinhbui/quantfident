# 🗄️ QuantFident Database Setup Guide

## Overview

QuantFident uses a **hybrid architecture** combining Firebase Authentication with PostgreSQL database:

- **Firebase Auth**: User authentication, email verification, secure token generation
- **PostgreSQL + Prisma**: Blog content storage, user profiles, admin management
- **Hybrid Benefits**: Scalable auth + powerful relational database operations

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Firebase Auth │    │  PostgreSQL     │
│                 │    │                 │
│ • User Auth     │    │ • Blog Posts    │
│ • Email Verify  │    │ • User Profiles │
│ • Token Gen     │    │ • Admin Mgmt    │
│ • Social Login  │    │ • Relationships │
└─────────────────┘    └─────────────────┘
         │                       │
         └───── Hybrid ──────────┘
```

## Quick Setup (Vercel Postgres)

### 1. Create Vercel Postgres Database

1. **Vercel Dashboard** → Project → **Settings** → **Storage**
2. **Create Database** → Choose **"Postgres"**
3. **Select Region** (closest to your users)
4. **Wait** for database creation (~2-3 minutes)

### 2. Get Database URL

After creation:
- **Storage Tab** → **Postgres** → **Connection Details**
- **Copy** `DATABASE_URL` (format: `postgresql://username:password@host:port/database`)

### 3. Environment Variables

**Vercel Dashboard** → **Settings** → **Environment Variables** → **Add New**:

```bash
# Database (NEW)
DATABASE_URL=postgresql://username:password@host:port/database

# Firebase (Existing)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=quantfident-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=quantfident-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=quantfident-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Site Config (Existing)
NEXT_PUBLIC_SITE_URL=https://quantfident.org

# Admin (Existing)
ADMIN_EMAIL=tribd.tec@gmail.com

# Firebase Admin (Existing)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### 4. Deploy Database Schema

```bash
# Install dependencies
npm install

# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 5. Test Database

```bash
# Run database tests
node scripts/test-db.js
```

**Expected Output:**
```
✅ Database connected successfully
✅ Test user created
✅ Test blog post created
✅ Found X blog posts
✅ Blog post updated
✅ Test data cleaned up
🎉 ALL DATABASE TESTS PASSED!
```

## Alternative Database Options

### Option B: Supabase (Free Tier)

1. **Create Account**: https://supabase.com
2. **New Project** → Choose Postgres
3. **Get Connection String** from Settings → Database
4. **Use same setup steps** as Vercel Postgres

### Option C: Local Development

```bash
# Install Postgres locally
# macOS
brew install postgresql

# Start service
brew services start postgresql

# Create database
createdb quantfident_dev

# Update .env.local
DATABASE_URL="postgresql://localhost:5432/quantfident_dev"
```

## Database Schema

### User Model
```prisma
model User {
  id              String   @id
  firebaseUid     String   @unique    // Links to Firebase Auth
  email           String   @unique
  emailVerified   Boolean  @default(false)
  displayName     String?
  photoURL        String?
  role            Role     @default(USER)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lastLoginAt     DateTime?
  totalLogins     Int      @default(0)

  posts           BlogPost[] @relation("AuthorPosts")
}
```

### Blog Post Model
```prisma
model BlogPost {
  id            String     @id @default(cuid())
  title         String
  slug          String     @unique
  content       String     // HTML from rich text editor
  excerpt       String?
  status        PostStatus @default(DRAFT)
  category      String
  tags          String[]   // Array of tags
  featuredImage String?

  readingTime   Int        @default(0)
  views         Int        @default(0)
  likes         Int        @default(0)

  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  publishedAt   DateTime?

  authorId      String
  author        User       @relation("AuthorPosts", fields: [authorId], references: [id])
}
```

## Security Implementation

### Server-Side Authentication Flow

```typescript
// 1. Extract Bearer token from Authorization header
const token = extractTokenFromHeader(authHeader);

// 2. Verify Firebase ID token
const decodedToken = await adminAuth.verifyIdToken(token);

// 3. Upsert user to Postgres
await BlogDbService.upsertUser({
  firebaseUid: decodedToken.uid,
  email: decodedToken.email,
  emailVerified: decodedToken.email_verified,
  // ...
});

// 4. Grant admin role if conditions met
if (decodedToken.email === ADMIN_EMAIL && decodedToken.email_verified) {
  await BlogDbService.grantAdminRole(decodedToken.uid, ADMIN_EMAIL);
}

// 5. Return authenticated user
return {
  uid: user.id,
  email: user.email,
  role: user.role.toLowerCase() as 'user' | 'admin'
};
```

### API Route Protection

```typescript
// Protected admin route
export async function POST(request: NextRequest) {
  // 1. Extract token
  const token = extractTokenFromHeader(request.headers.get('authorization'));

  // 2. Require admin
  const adminUser = await requireAdmin(token);

  // 3. Proceed with operation
  const postId = await BlogDbService.createPost({
    authorId: adminUser.uid,
    // ... post data
  });

  return NextResponse.json({ postId });
}
```

## Performance Optimization

### Database Indexes

```prisma
model BlogPost {
  @@index([status, publishedAt])  // Fast published post queries
  @@index([slug])                 // Fast slug lookups
  @@index([authorId])             // Fast author post queries
}
```

### Query Optimization

```typescript
// Efficient post fetching
const posts = await prisma.blogPost.findMany({
  select: {  // Only fetch needed fields
    id: true,
    title: true,
    slug: true,
    excerpt: true,
    publishedAt: true,
    author: {
      select: { displayName: true }
    }
  },
  where: { status: 'PUBLISHED' },
  orderBy: { publishedAt: 'desc' },
  take: 10,  // Limit results
});
```

## Migration & Deployment

### Development Workflow

```bash
# 1. Make schema changes in prisma/schema.prisma

# 2. Push to database
npx prisma db push

# 3. Generate updated client
npx prisma generate

# 4. Test changes
npm run dev
node scripts/test-db.js
```

### Production Deployment

```bash
# 1. Commit schema changes
git add prisma/schema.prisma
git commit -m "Update database schema"

# 2. Push to GitHub (triggers Vercel deploy)
git push origin main

# 3. Vercel automatically:
#    - Installs dependencies
#    - Runs prisma db push
#    - Generates Prisma client
#    - Deploys application
```

## Monitoring & Maintenance

### Vercel Dashboard
- **Storage Tab**: Monitor database usage and performance
- **Logs**: Check for connection errors or slow queries
- **Analytics**: Query performance metrics

### Health Checks
```typescript
// API route: /api/health
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    }, { status: 500 });
  }
}
```

### Backup Strategy
- **Vercel Postgres**: Automatic daily backups
- **Supabase**: Point-in-time recovery available
- **Export Data**: Regular JSON exports for safety

## Troubleshooting

### Connection Issues

```bash
# Check environment variables
echo $DATABASE_URL

# Test connection manually
npx prisma db push --preview-feature

# View database
npx prisma studio
```

### Common Errors

1. **"Can't reach database server"**
   - Check DATABASE_URL format
   - Verify database is running (Vercel/Supabase)
   - Check firewall settings

2. **"Table doesn't exist"**
   - Run `npx prisma db push`
   - Check schema.prisma for errors

3. **"Authentication failed"**
   - Verify DATABASE_URL credentials
   - Check database user permissions

## Benefits of This Architecture

### Scalability
- **Firebase Auth**: Handles millions of users
- **Postgres**: Complex queries, relationships, indexing
- **Prisma**: Type-safe database operations

### Security
- **Token-based auth**: No password storage
- **Server-side validation**: All admin operations verified
- **Email verification**: Required for admin access

### Developer Experience
- **Type Safety**: Full TypeScript support with Prisma
- **Auto-generated**: Database client from schema
- **Migrations**: Version-controlled schema changes

### Performance
- **Connection Pooling**: Prisma handles efficiently
- **Optimized Queries**: Built-in query optimization
- **Caching**: Next.js ISR for blog posts

## Next Steps

1. **Setup Database**: Choose Vercel Postgres or Supabase
2. **Configure Environment**: Add DATABASE_URL to Vercel
3. **Deploy Schema**: Run `npx prisma db push`
4. **Test Operations**: Run `node scripts/test-db.js`
5. **Create Content**: Start using admin dashboard
6. **Monitor Performance**: Use Vercel analytics

This hybrid Firebase + Postgres architecture provides enterprise-grade scalability and security for your QuantFident blog platform! 🚀