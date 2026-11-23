const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function reset() {
  const newPass = 'Admin123!';
  const hash = bcrypt.hashSync(newPass, 10);
  const conn = await mysql.createConnection({
    host: 'localhost', port: 3306, user: 'root', password: '', database: 'smartvil'
  });
  await conn.execute('UPDATE profiles SET password_hash = ? WHERE role = "superadmin"', [hash]);
  const [rows] = await conn.execute('SELECT email FROM profiles WHERE role = "superadmin"');
  console.log('✅ Password berhasil direset!');
  console.log('   Email   :', rows[0]?.email);
  console.log('   Password: Admin123!');
  await conn.end();
}
reset().catch(e => console.error('Error:', e.message));
