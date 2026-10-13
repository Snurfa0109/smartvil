#!/bin/bash
set -e

echo "========================================="
echo "  SMARTVIL VPS SETUP - Step 1: System"
echo "========================================="

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install MySQL
apt install -y mysql-server

# Install Nginx & Certbot
apt install -y nginx certbot python3-certbot-nginx

# Install Git
apt install -y git

echo ""
echo "✅ System packages installed!"
echo "Node: $(node -v)"
echo "npm: $(npm -v)"
echo "MySQL: $(mysql --version)"
echo "Nginx: $(nginx -v 2>&1)"
echo ""

echo "========================================="
echo "  Step 2: MySQL Setup"
echo "========================================="

# Start MySQL
systemctl start mysql
systemctl enable mysql

# Create database and user
mysql -e "CREATE DATABASE IF NOT EXISTS smartvil CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'smartvil'@'localhost' IDENTIFIED BY 'SmartVil2026!Secure';"
mysql -e "GRANT ALL PRIVILEGES ON smartvil.* TO 'smartvil'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

echo "✅ MySQL database 'smartvil' created!"
echo ""

echo "========================================="
echo "  Step 3: Clone & Build Project"
echo "========================================="

# Clone project
cd /opt
git clone https://github.com/Snurfa0109/smartvil.git
cd /opt/smartvil

# Create .env.local
cat > .env.local << 'ENVEOF'
DB_HOST=localhost
DB_PORT=3306
DB_USER=smartvil
DB_PASSWORD=SmartVil2026!Secure
DB_NAME=smartvil
JWT_SECRET=smartvil-jwt-secret-prod-2026-random-string-here
NEXT_PUBLIC_BASE_URL=http://157.230.39.168
ENVEOF

# Import schema
mysql -u smartvil -p'SmartVil2026!Secure' smartvil < mysql/schema.sql

# Install dependencies & build
npm install
npm run build

echo ""
echo "✅ Project built successfully!"
echo ""

echo "========================================="
echo "  Step 4: Create Systemd Service"
echo "========================================="

cat > /etc/systemd/system/smartvil.service << 'SERVICEEOF'
[Unit]
Description=SmartVil Next.js App
After=network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/smartvil
ExecStart=/usr/bin/node /opt/smartvil/.next/standalone/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=0.0.0.0

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Copy static files for standalone
cp -r /opt/smartvil/.next/static /opt/smartvil/.next/standalone/.next/static
cp -r /opt/smartvil/public /opt/smartvil/.next/standalone/public

systemctl daemon-reload
systemctl enable smartvil
systemctl start smartvil

echo "✅ SmartVil service started!"
echo ""

echo "========================================="
echo "  Step 5: Nginx Reverse Proxy"
echo "========================================="

cat > /etc/nginx/sites-available/smartvil << 'NGINXEOF'
server {
    listen 80;
    server_name 157.230.39.168;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/smartvil /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Open firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "========================================="
echo "  🎉 DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "  Website: http://157.230.39.168"
echo "  Status:  systemctl status smartvil"
echo "  Logs:    journalctl -u smartvil -f"
echo ""
echo "  Seed admin account:"
echo "  curl -X POST http://localhost:3000/api/seed"
echo ""
echo "========================================="
