// Setup Railway MySQL schema
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupRailwayMySQL() {
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

  const schema = fs.readFileSync(path.join(__dirname, '../mysql/schema.sql'), 'utf8');
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`\n📋 Executing ${statements.length} SQL statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt.toLowerCase().includes('create table')) {
      const tableName = stmt.match(/CREATE TABLE.*?`?(\w+)`?\s*\(/i)?.[1];
      console.log(`${i + 1}. Creating table: ${tableName}...`);
    }
    try {
      await connection.execute(stmt);
      console.log('   ✅ Success');
    } catch (err) {
      console.log('   ⚠️  ' + err.message);
    }
  }

  console.log('\n🎉 Schema setup complete!');
  await connection.end();
}

setupRailwayMySQL().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
