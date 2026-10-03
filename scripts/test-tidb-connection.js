// Test TiDB Cloud connection dengan berbagai format
const mysql = require('mysql2/promise');

const configs = [
  {
    name: 'Config 1: With SSL (recommended)',
    config: {
      host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '3aSzUctUDWb3Crw.root',
      password: '9ATjMGxr1fTHA80F',
      database: 'test',
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
      }
    }
  },
  {
    name: 'Config 2: SSL with sys database',
    config: {
      host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '3aSzUctUDWb3Crw.root',
      password: '9ATjMGxr1fTHA80F',
      database: 'sys',
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
      }
    }
  },
];

async function testConnection(cfg) {
  console.log(`\n🔌 Testing: ${cfg.name}`);
  try {
    const conn = await mysql.createConnection(cfg.config);
    console.log('   ✅ Connected!');
    const [rows] = await conn.execute('SELECT VERSION() as version');
    console.log(`   📊 TiDB Version: ${rows[0].version}`);
    const [tables] = await conn.execute('SHOW TABLES');
    console.log(`   📋 Tables: ${tables.length} found`);
    await conn.end();
    return cfg;
  } catch (err) {
    console.log(`   ❌ Failed: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Testing TiDB Cloud connections...\n');
  
  for (const cfg of configs) {
    const success = await testConnection(cfg);
    if (success) {
      console.log('\n🎉 Found working config!');
      console.log('Use this in .env.local:');
      console.log(`MYSQL_HOST=${success.config.host}`);
      console.log(`MYSQL_PORT=${success.config.port}`);
      console.log(`MYSQL_USER=${success.config.user}`);
      console.log(`MYSQL_PASSWORD=${success.config.password}`);
      console.log(`MYSQL_DATABASE=${success.config.database}`);
      break;
    }
  }
}

main();
