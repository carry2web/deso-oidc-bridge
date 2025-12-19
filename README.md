# DeSo OIDC Bridge - SafetyNet.Social

Express.js OIDC provider that bridges DeSo Identity authentication to Microsoft 365 for SafetyNet.Social community members.

## Authentication Flow

1. **User logs in with DeSo Identity** → System checks if `desohandle@safetynet.social` exists in Entra ID
2. **If user exists** → Dashboard showing M365 apps + Automatic OIDC login capability ✅
3. **If user doesn't exist** → Registration form with justification → Admin approval → User provisioned in Entra ID

## Features

- ✅ OIDC 1.0 compliant endpoints
- ✅ DeSo Identity integration (login with public key)
- ✅ Dashboard with M365 apps for authenticated users
- ✅ Automatic login for existing Entra ID users
- ✅ Registration with justification requirement
- ✅ JWT signing with RS256
- ✅ Admin approval workflow
- ✅ Session management
- ✅ Simple HTML UI (no framework bloat)
- ✅ Docker ready
- ✅ GitHub Actions CI/CD to Azure

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Run Development Server

```bash
npm run dev
```

Server runs on http://localhost:3000

## OIDC Endpoints

- `GET /.well-known/openid-configuration` - Discovery document
- `GET /jwks` - JSON Web Key Set
- `GET /authorize` - Authorization endpoint
- `POST /token` - Token endpoint
- `GET /userinfo` - UserInfo endpoint

## User Pages

- `/login.html` - DeSo Identity login
- `/dashboard.html` - Dashboard with M365 apps for authenticated users
- `/register.html` - Membership registration with justification
- `/admin.html` - Admin approval dashboard

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `OIDC_ISSUER` | OIDC issuer URL | `http://localhost:3000` |
| `SESSION_SECRET` | Session encryption key | (required) |
| `ADMIN_PUBLIC_KEYS` | Comma-separated admin public keys | (required) |

## Configure Microsoft Entra ID

### 1. Register App in Azure

1. Go to Azure Portal → Entra ID → App registrations
2. Click "New registration"
3. Set redirect URI: `https://login.microsoftonline.com/common/oauth2/nativeclient`
4. After creation, go to "Certificates & secrets" → Create new secret

### 2. Configure OIDC

1. In your Azure app, go to "Authentication"
2. Add platform → Web
3. Set Redirect URI to: `https://your-bridge-url.com/callback`
4. In "Token configuration", add optional claims: `email`, `preferred_username`

### 3. Test Integration

Your OIDC provider URL: `https://your-bridge-url.com/.well-known/openid-configuration`

Point Microsoft to this URL for SSO configuration.

## Docker Deployment

### Build Image

```bash
docker build -t deso-oidc-bridge .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e OIDC_ISSUER=https://your-domain.com \
  -e SESSION_SECRET=your-secret \
  -e ADMIN_PUBLIC_KEYS=BC1YLh8... \
  deso-oidc-bridge
```

## Azure Deployment

### Using Azure Container Registry

```bash
# Login to Azure
az login

# Create container registry
az acr create --name yourregistry --resource-group yourgroup --sku Basic

# Build and push
az acr build --registry yourregistry --image deso-oidc-bridge:latest .

# Create web app
az webapp create --name deso-bridge --resource-group yourgroup \
  --plan yourplan --deployment-container-image yourregistry.azurecr.io/deso-oidc-bridge:latest
```

## Project Structure

```
deso-oidc-bridge/
├── server.js           # Main Express server
├── lib/
│   ├── jwt.js         # JWT token creation
│   ├── keys.js        # RSA key pair generation
│   ├── store.js       # In-memory data stores
│   └── graphClient.js # Microsoft Graph API client
├── routes/
│   ├── oidc.js        # OIDC endpoints
│   ├── auth.js        # DeSo auth callbacks
│   └── admin.js       # Admin approval API
├── public/
│   ├── login.html     # DeSo Identity login
│   ├── dashboard.html # M365 apps dashboard
│   ├── register.html  # Registration form with justification
│   └── admin.html     # Admin approval dashboard
└── Dockerfile         # Docker configuration
```

## Security Notes

- RSA keys are generated in-memory (restart = new keys)
- Sessions are in-memory (restart = logout all)
- For production, use Redis for sessions and Azure Key Vault for keys
- Always use HTTPS in production
- Set strong `SESSION_SECRET`

## License

MIT
