// Inisialisasi skema database & superadmin otomatis dari .env.local atau env vars
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

async function initDB() {
  loadEnv();

  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'smartvil';

  console.log(`🔌 Menghubungkan ke MySQL ${host}:${port}/${database}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  console.log('✅ Terhubung ke MySQL!');

  // 1. Eksekusi Schema
  const schemaPath = path.join(__dirname, '../mysql/schema.sql');
  if (fs.existsSync(schemaPath)) {
    console.log('📋 Mengimpor schema.sql...');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const cleanSchema = schema
      .split('\n')
      .filter((l) => !l.trim().startsWith('--'))
      .join('\n');
    const statements = cleanSchema
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    for (const stmt of statements) {
      try {
        await conn.execute(stmt);
      } catch (err) {
        if (!err.message.includes('already exists')) {
          console.warn('   ⚠️', err.message);
        }
      }
    }
    console.log('✅ Semua tabel berhasil dibuat/diverifikasi!');
  }

  // 2. Insert Super Admin default jika belum ada
  console.log('👤 Memeriksa akun Super Admin...');
  const [existing] = await conn.execute(
    'SELECT id FROM profiles WHERE role = "superadmin" LIMIT 1'
  );

  if (!existing || existing.length === 0) {
    const adminPasswordHash = '$2b$10$o9C5PCBTuAoA4Wv3Tat6KO/EB.ODU/8mV..D7chg.Uxgx5p8EDi42'; // admin123
    await conn.execute(
      `INSERT INTO profiles (id, email, display_name, role, active, password_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'admin-default-001',
        'admin@smartvil.id',
        'Super Admin',
        'superadmin',
        1,
        adminPasswordHash,
      ]
    );
    console.log('✅ Akun Super Admin dibuat:');
    console.log('   Email: admin@smartvil.id');
    console.log('   Sandi: admin123');
  } else {
    console.log('ℹ️  Akun Super Admin sudah ada.');
  }

  // 3. Tampilkan daftar tabel
  const [tables] = await conn.execute('SHOW TABLES');
  console.log(`📊 Total tabel di database: ${tables.length}`);

  await conn.end();
}

initDB().catch((err) => {
  console.error('❌ Inisialisasi database gagal:', err.message);
  process.exit(1);
});
