# Implantacao na Hostinger

Este projeto tem duas partes:

- `backend/`: API Node.js + Express
- `frontend/`: React + Vite
- Banco: MySQL

## Opcao recomendada: Hostinger Web Apps Hosting

A Hostinger oferece hospedagem de apps Node.js com deploy por GitHub/ZIP e MySQL gerenciado. Use esta opcao se voce quer evitar configurar servidor manualmente.

### 1. Banco MySQL

No painel da Hostinger:

1. Crie um banco MySQL.
2. Anote:
   - host
   - porta
   - nome do banco
   - usuario
   - senha
3. Importe o arquivo:

```bash
backend/database/schema.sql
```

Se o banco ja existir de uma versao anterior, importe tambem:

```bash
backend/database/002_user_settings.sql
backend/database/003_payments_password_reset.sql
```

### 2. Backend Node.js

Crie uma aplicacao Node.js apontando para a pasta `backend`.

Comandos:

```bash
npm install --omit=dev
npm start
```

Arquivo de entrada:

```txt
src/server.js
```

Variaveis de ambiente:

```env
PORT=3333
NODE_ENV=production
FRONTEND_URL=https://SEU-DOMINIO.com

DB_HOST=HOST_DO_MYSQL
DB_PORT=3306
DB_USER=USUARIO_DO_MYSQL
DB_PASSWORD=SENHA_DO_MYSQL
DB_NAME=NOME_DO_BANCO

JWT_SECRET=TROQUE_POR_UMA_CHAVE_GRANDE_E_FORTE
JWT_EXPIRES_IN=7d
```

### 3. Frontend React

Crie uma aplicacao/site estatico para o frontend.

Antes do build, configure:

```env
VITE_API_URL=https://SEU-DOMINIO-DA-API.com/api
```

Comandos:

```bash
npm install
npm run build
```

Pasta publicada:

```txt
frontend/dist
```

Se frontend e backend ficarem no mesmo dominio, use um subdominio para a API, por exemplo:

```txt
https://api.seudominio.com/api
```

E o frontend em:

```txt
https://seudominio.com
```

## Opcao VPS Hostinger

Use esta opcao se voce tiver uma VPS Ubuntu e quiser controle completo.

### 1. Instalar dependencias

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx mysql-client
sudo npm install -g pm2
```

### 2. Baixar projeto

```bash
git clone https://github.com/octaviano221/financeiro.git
cd financeiro
```

### 3. Configurar backend

```bash
cd backend
cp .env.example .env
nano .env
npm install --omit=dev
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### 4. Configurar frontend

```bash
cd ../frontend
cp .env.example .env
nano .env
npm install
npm run build
```

### 5. Nginx exemplo

Crie:

```bash
sudo nano /etc/nginx/sites-available/financeiro
```

Conteudo:

```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    root /var/www/financeiro/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3333/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ative:

```bash
sudo ln -s /etc/nginx/sites-available/financeiro /etc/nginx/sites-enabled/financeiro
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL

Se usar VPS, instale SSL com Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

## Checklist final

- Banco importado
- `.env` do backend preenchido
- `JWT_SECRET` forte
- `FRONTEND_URL` com dominio real
- `VITE_API_URL` apontando para API real
- Frontend buildado
- HTTPS ativo
- Testar cadastro
- Testar login
- Testar criar receita/despesa/divida
- Testar registrar pagamento
- Testar exportacao CSV
- Testar dados demo em Configuracoes

## Repositorio

```txt
https://github.com/octaviano221/financeiro
```
