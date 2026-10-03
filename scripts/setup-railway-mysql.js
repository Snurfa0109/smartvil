// Setup Railway MySQL schema - Fixed version
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
  
  // Better split: remove comments first, then split by semicolon
  const cleanSchema = schema
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
    
  const statements = cleanSchema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 10); // Skip empty or too short

  console.log(`\n📋 Executing ${statements.length} SQL statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const tableName = stmt.match(/CREATE TABLE.*?`?(\w+)`?\s*\(/i)?.[1];
    if (tableName) {
      console.log(`${i + 1}. Creating table: ${tableName}...`);
    }
    try {
      await connection.execute(stmt);
      console.log('   ✅ Success');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.log('   ⚠️  ' + err.message);
      } else {
        console.log('   ℹ️  Already exists, skipped');
      }
    }
  }

  console.log('\n🎉 Schema setup complete!');
  
  // Check tables
  const [tables] = await connection.execute('SHOW TABLES');
  console.log(`\n📊 Total tables: ${tables.length}`);
  tables.forEach(t => console.log(`   - ${Object.values(t)[0]}`));
  
  await connection.end();
}

setupRailwayMySQL().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
