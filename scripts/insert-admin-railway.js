// Insert admin user ke Railway MySQL
const mysql = require('mysql2/promise');

async function insertAdmin() {
  const config = {
    host: 'kodama.proxy.rlwy.net',
    port: 34888,
    user: 'root',
    password: 'aJxvesuCTlLXzaTbafcmHxcFSrxJbJhS',
    database: 'railway',
  };

  console.log('🔌 Connecting to Railway MySQL...');
  const connection = await mysql.createConnection(config);
  console.log('✅ Connected!');

  console.log('\n👤 Inserting admin user...');
  
  try {
    await connection.execute(
      `INSERT INTO profiles (id, email, display_name, role, active, password_hash) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'admin-railway-001',
        'admin@banjaragung.go.id',
        'Super Admin',
        'superadmin',
        1,
        '$2b$10$o9C5PCBTuAoA4Wv3Tat6KO/EB.ODU/8mV..D7chg.Uxgx5p8EDi42'
      ]
    );
    console.log('✅ Admin user created!');
    console.log('\n📧 Login credentials:');
    console.log('   Email: admin@banjaragung.go.id');
    console.log('   Password: admin123');
  } catch (err) {
    console.log('⚠️  ' + err.message);
  }

  await connection.end();
}

insertAdmin().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
