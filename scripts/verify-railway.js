// Verify Railway MySQL tables and data
const mysql = require('mysql2/promise');

async function verify() {
  const config = {
    host: 'kodama.proxy.rlwy.net',
    port: 34888,
    user: 'root',
    password: 'aJxvesuCTlLXzaTbafcmHxcFSrxJbJhS',
    database: 'railway',
  };

  console.log('🔌 Connecting to Railway MySQL...');
  const connection = await mysql.createConnection(config);
  console.log('✅ Connected!\n');

  console.log('📊 Checking tables...');
  const [tables] = await connection.execute('SHOW TABLES');
  console.log(`Total tables: ${tables.length}\n`);
  
  for (const t of tables) {
    const tableName = Object.values(t)[0];
    const [count] = await connection.execute(`SELECT COUNT(*) as cnt FROM ${tableName}`);
    console.log(`   ${tableName}: ${count[0].cnt} rows`);
  }

  console.log('\n👤 Checking admin user...');
  const [admins] = await connection.execute('SELECT email, display_name, role FROM profiles');
  if (admins.length > 0) {
    console.log(`   ✅ Found ${admins.length} admin(s):`);
    admins.forEach(a => console.log(`      - ${a.email} (${a.role})`));
  } else {
    console.log('   ⚠️  No admin users found');
  }

  await connection.end();
  console.log('\n✅ Verification complete!');
}

verify().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
