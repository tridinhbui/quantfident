// Database connection and basic operations test
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testDatabaseConnection() {
  console.log('🧪 TESTING DATABASE CONNECTION...\n');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test user operations
    console.log('\n📝 Testing User Operations...');

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        id: 'test-user-id',
        firebaseUid: 'test-firebase-uid',
        email: 'test@example.com',
        emailVerified: true,
        displayName: 'Test User',
        role: 'USER',
      },
    });
    console.log('✅ Test user created:', testUser.id);

    // Test blog post operations
    console.log('\n📄 Testing Blog Post Operations...');

    // Create test blog post
    const testPost = await prisma.blogPost.create({
      data: {
        title: 'Test Blog Post',
        slug: 'test-blog-post',
        content: '<p>This is a test blog post content.</p>',
        excerpt: 'Test post excerpt',
        authorId: testUser.id,
        status: 'DRAFT',
        tags: ['test', 'blog'],
        category: 'Technology',
        readingTime: 2,
      },
    });
    console.log('✅ Test blog post created:', testPost.id);

    // Query posts
    const posts = await prisma.blogPost.findMany({
      include: { author: true },
      take: 5,
    });
    console.log(`✅ Found ${posts.length} blog posts`);

    // Test update
    const updatedPost = await prisma.blogPost.update({
      where: { id: testPost.id },
      data: { views: 10, likes: 5 },
    });
    console.log('✅ Blog post updated:', {
      views: updatedPost.views,
      likes: updatedPost.likes
    });

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await prisma.blogPost.delete({ where: { id: testPost.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 ALL DATABASE TESTS PASSED!');
    console.log('✅ Connection: Working');
    console.log('✅ CRUD Operations: Working');
    console.log('✅ Relations: Working');
    console.log('✅ Queries: Working');

  } catch (error) {
    console.error('\n❌ DATABASE TEST FAILED:');
    console.error('Error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check DATABASE_URL environment variable');
    console.error('2. Ensure Postgres database is running');
    console.error('3. Run: npx prisma db push');
    console.error('4. Check database credentials');
  } finally {
    await prisma.$disconnect();
    console.log('\n📪 Database connection closed');
  }
}

// Health check function
async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1 as health_check`;
    console.log('💚 Database health: GOOD');
    return true;
  } catch (error) {
    console.log('💔 Database health: BAD');
    console.log('Error:', error.message);
    return false;
  }
}

// Run tests
async function main() {
  console.log('🚀 QUANTFIDENT DATABASE TEST SUITE\n');
  console.log('=' .repeat(50));

  // Environment check
  console.log('🔍 ENVIRONMENT CHECK:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('');

  // Health check
  const isHealthy = await healthCheck();
  if (!isHealthy) {
    process.exit(1);
  }
  console.log('');

  // Full test suite
  await testDatabaseConnection();

  console.log('\n' + '='.repeat(50));
  console.log('🏁 TEST SUITE COMPLETED');
}

main().catch((error) => {
  console.error('💥 UNEXPECTED ERROR:', error);
  process.exit(1);
});