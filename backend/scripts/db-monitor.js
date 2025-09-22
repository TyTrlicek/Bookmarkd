// Database Performance Monitoring Script
const prisma = require('../lib/prisma');

async function checkDatabaseHealth() {
  console.log('🔍 Database Health Check Starting...\n');

  try {
    // 1. Connection Test
    console.log('1. Testing database connection...');
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const connectionTime = Date.now() - start;
    console.log(`   ✅ Connection successful (${connectionTime}ms)\n`);

    // 2. Active Connections
    console.log('2. Checking active connections...');
    const connections = await prisma.$queryRaw`
      SELECT count(*) as active_connections
      FROM pg_stat_activity
      WHERE state = 'active'
    `;
    console.log(`   📊 Active connections: ${connections[0].active_connections}\n`);

    // 3. Database Size
    console.log('3. Database size information...');
    const dbSize = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    console.log(`   📦 Database size: ${dbSize[0].size}\n`);

    // 4. Table Statistics
    console.log('4. Table row counts...');
    const tableStats = await Promise.all([
      prisma.user.count(),
      prisma.book.count(),
      prisma.userBook.count(),
      prisma.review.count(),
      prisma.userActivity.count(),
    ]);

    console.log(`   👥 Users: ${tableStats[0]}`);
    console.log(`   📚 Books: ${tableStats[1]}`);
    console.log(`   📖 User Books: ${tableStats[2]}`);
    console.log(`   📝 Reviews: ${tableStats[3]}`);
    console.log(`   🎯 Activities: ${tableStats[4]}\n`);

    // 5. Slow Queries (if logging is enabled)
    console.log('5. Recent query performance...');
    const slowQueries = await prisma.$queryRaw`
      SELECT query, mean_exec_time, calls
      FROM pg_stat_statements
      WHERE mean_exec_time > 100
      ORDER BY mean_exec_time DESC
      LIMIT 5
    `.catch(() => {
      console.log('   ℹ️  pg_stat_statements not available (this is normal for most setups)\n');
      return [];
    });

    if (slowQueries.length > 0) {
      console.log('   ⚠️  Slow queries detected:');
      slowQueries.forEach(q => {
        console.log(`      ${q.mean_exec_time.toFixed(2)}ms avg - ${q.calls} calls`);
      });
    } else {
      console.log('   ✅ No slow queries detected\n');
    }

    // 6. Index Usage
    console.log('6. Index efficiency...');
    const indexStats = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE idx_scan > 0
      ORDER BY idx_scan DESC
      LIMIT 10
    `;

    if (indexStats.length > 0) {
      console.log('   📈 Most used indexes:');
      indexStats.forEach(idx => {
        console.log(`      ${idx.tablename}.${idx.indexname}: ${idx.idx_scan} scans`);
      });
    }

    console.log('\n✅ Database health check completed successfully!');

  } catch (error) {
    console.error('❌ Database health check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Performance recommendations
function printPerformanceRecommendations() {
  console.log('\n📋 Performance Recommendations:');
  console.log('1. Monitor connection count - should stay under 80% of your limit');
  console.log('2. Watch for queries taking > 500ms consistently');
  console.log('3. Enable pg_stat_statements for query analysis in production');
  console.log('4. Set up database connection pooling with PgBouncer');
  console.log('5. Monitor database size growth and plan for scaling');
  console.log('6. Regular VACUUM and ANALYZE operations');
  console.log('7. Consider read replicas for read-heavy workloads');
}

// Run the health check
if (require.main === module) {
  checkDatabaseHealth()
    .then(() => printPerformanceRecommendations())
    .catch(console.error);
}

module.exports = { checkDatabaseHealth };