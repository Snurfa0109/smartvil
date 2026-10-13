# Panduan Deploy SmartVil ke VPS

## Prasyarat VPS
- Ubuntu 22.04+ / Debian 12+
- Minimal RAM 1GB, Storage 10GB
- Node.js 20+ (atau Docker)
- MySQL 8.0+ (bisa di VPS yang sama atau pakai Railway/PlanetScale)
- Domain yang sudah diarahkan ke IP VPS

## Opsi 1: Deploy dengan Docker (Direkomendasikan)

### 1. Install Docker di VPS
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

### 2. Clone repo
```bash
git clone https://github.com/Snurfa0109/smartvil.git
cd smartvil
```

### 3. Buat file environment production
```bash
cp .env.example .env.production
nano .env.production
```
Isi semua value:
- `MYSQL_HOST` - host database MySQL
- `MYSQL_PORT` - port (default 3306)
- `MYSQL_USER` - username database
- `MYSQL_PASSWORD` - password database
- `MYSQL_DATABASE` - nama database
- `JWT_SECRET` - random string panjang (minimal 32 karakter), generate dengan: `openssl rand -hex 32`
- `GEMINI_API_KEY` - API key Google Gemini

### 4. Setup Database
Jalankan schema SQL di MySQL server:
```bash
mysql -h YOUR_HOST -u YOUR_USER -p YOUR_DATABASE < mysql/schema.sql
```

Buat akun superadmin pertama (ganti email dan password):
```bash
mysql -h YOUR_HOST -u YOUR_USER -p YOUR_DATABASE -e "
INSERT INTO profiles (id, email, display_name, role, password_hash, active)
VALUES (UUID(), 'admin@banjar-agung.id', 'Super Admin', 'superadmin', 
'\$2a\$10\$YOUR_BCRYPT_HASH', 1);
"
```

Atau gunakan endpoint seed setelah deploy (hanya superadmin yang bisa akses).

### 5. Build dan jalankan
```bash
docker compose up -d --build
```

### 6. Setup Nginx + SSL
```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Copy nginx config
sudo cp deploy/nginx.conf /etc/nginx/sites-available/smartvil
sudo ln -s /etc/nginx/sites-available/smartvil /etc/nginx/sites-enabled/

# Edit domain name
sudo nano /etc/nginx/sites-available/smartvil
# Ganti "your-domain.com" dengan domain asli

# Test config
sudo nginx -t

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Restart nginx
sudo systemctl restart nginx
```

### 7. Verifikasi
```bash
curl -I https://your-domain.com
# Harus return 200 OK
```

---

## Opsi 2: Deploy Manual (tanpa Docker)

### 1. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Clone dan install
```bash
git clone https://github.com/Snurfa0109/smartvil.git
cd smartvil
npm ci
```

### 3. Environment
```bash
cp .env.example .env.local
nano .env.local
# Isi semua value sama seperti di Opsi 1
```

### 4. Build
```bash
npm run build
```

### 5. Jalankan dengan PM2
```bash
sudo npm install -g pm2

# Jalankan standalone server
pm2 start .next/standalone/server.js --name smartvil
pm2 save
pm2 startup
```

### 6. Setup Nginx + SSL
Sama seperti Opsi 1 langkah 6.

---

## Setelah Deploy

### Buat Akun Admin Pertama
1. Akses database MySQL
2. Insert akun superadmin:
```sql
INSERT INTO profiles (id, email, display_name, role, password_hash, active)
VALUES (UUID(), 'admin@kelurahan.id', 'Super Admin', 'superadmin', 
'$2a$10$HASH_DARI_BCRYPT', 1);
```

Untuk generate bcrypt hash, jalankan di Node.js:
```bash
node -e "const b=require('bcryptjs');b.hash('password123',10).then(h=>console.log(h))"
```

### Update / Redeploy
```bash
cd smartvil
git pull origin master

# Docker:
docker compose up -d --build

# Manual:
npm ci && npm run build
pm2 restart smartvil
```

### Backup Database
```bash
mysqldump -h HOST -u USER -p DATABASE > backup_$(date +%Y%m%d).sql
```

## Troubleshooting
- **Port 3000 sudah dipakai**: `lsof -i :3000` lalu `kill PID`
- **Build error**: Cek `npm run build` output, pastikan semua env var terisi
- **Database connection refused**: Pastikan MySQL host/port benar, firewall buka port
- **SSL error**: Jalankan `sudo certbot renew --dry-run` untuk test renewal
