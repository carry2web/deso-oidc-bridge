az acr credential show --name desooiidcbridge# SafetyNet.Social OIDC Bridge - Architecture


## Multi-Tenant Authentication Flow

```
┌─────────────┐
│   User      │
│  (DeSo ID)  │
└──────┬──────┘
       │ 1. Login with DeSo Identity
       ▼
┌─────────────────────────────────────┐
│   DeSo OIDC Bridge                  │
│   (Express.js Application)          │
├─────────────────────────────────────┤
│  2. Check: username@safetynet.social│
│     exists in Entra ID (Work Tenant)?│
└──────┬────────────────────┬─────────┘
       │                    │
      │ YES                │ NO
      │                    │
      ▼                    ▼
    ┌──────────────┐    ┌──────────────────────────────┐
    │ 3a. Dashboard│    │ 3b. Registration Logic      │
    │     with M365│    │ ┌─────────────────────────┐ │
    │     Apps     │    │ │ If @safetynet.social:   │ │
    │ - Outlook    │    │ │  - Show registration   │ │
    │ - Teams      │    │ │    form (justification)│ │
    │ - Word       │    │ │  - Admin approval req. │ │
    │ - Excel      │    │ └─────────────────────────┘ │
    │ - PowerPoint │    │ ┌─────────────────────────┐ │
    │ - etc.       │    │ │ Else (external email): │ │
    └──────┬───────┘    │ │  - Auto-approve        │ │
      │            │ │  - No admin approval   │ │
      │            │ └─────────────────────────┘ │
      │            └─────────────┬────────────────┘
      │                          │
      │                          ▼
      │                ┌────────────────────┐
      │                │ If approval needed │
      │                │ → Admin reviews    │
      │                │ → Approve → User   │
      │                │   provisioned      │
      │                └─────────┬──────────┘
      │                          │
      │◄─────────────────────────┘
      │
      ▼
    ┌────────────────────┐
    │ Click any M365 app │
    │ → OIDC login flow  │
    │ → Access granted   │
    └────────────────────┘
```

## Components

### 1. Frontend (Public HTML)

- **login.html** - DeSo Identity login interface
- **dashboard.html** - M365 apps dashboard for authenticated users
  - Shows available Microsoft 365 apps (Outlook, Teams, Word, Excel, etc.)
  - Direct links to each app with @safetynet.social authentication
  - Embedded iframe of apps.microsoft.com for full app launcher
- **register.html** - Membership registration form with justification
- **admin.html** - Admin dashboard for approving/rejecting requests

### 2. Backend (Express.js Routes)

#### `/routes/auth.js`
- `POST /login` - Handles DeSo login callback
  - Checks if user exists in Entra ID
  - Auto-login if exists, otherwise redirect to registration
- `POST /logout` - Session destruction
- `GET /session` - Current session status

#### `/routes/oidc.js`
- `GET /.well-known/openid-configuration` - OIDC discovery
- `GET /jwks` - JSON Web Key Set
- `GET /authorize` - Authorization endpoint
- `POST /token` - Token endpoint
- `GET /userinfo` - UserInfo endpoint

#### `/routes/admin.js`
- `GET /admin/check` - Verify admin status
- `GET /admin/approvals` - List pending registrations
- `POST /admin/approvals` - Approve/reject registration
- `POST /admin/register` - Submit registration request

### 3. Libraries

#### `/lib/graphClient.js`
- `checkUserExists(email)` - Queries Entra ID to verify user existence
- `getUser(email)` - Retrieves user details from Entra ID
- Uses Microsoft Graph API with client credentials

#### `/lib/jwt.js`
- `createIdToken(userClaims)` - Generates signed JWT ID tokens
- `createAccessToken(userClaims)` - Generates access tokens
- RS256 signing algorithm

#### `/lib/keys.js`
- `generateKeyPair()` - Creates RSA key pairs for JWT signing
- `getPublicKey()` - Returns public key in JWK format

#### `/lib/store.js`
- In-memory storage for:
  - Auth codes (10 min expiry)
  - Access tokens (1 hour expiry)
  - Pending approvals
  - Admin users

## Data Flow

### Scenario 1: Existing User (Dashboard Access)

```
User → DeSo Login → Check Entra ID → User Found → Dashboard with M365 Apps
     ↓
Click App (e.g., Outlook) → OIDC Flow → Authenticated Access to App
```

### Scenario 2: New User (Registration Required)

```
User → DeSo Login → Check Entra ID → User Not Found → Registration Form
     ↓
Submit Justification → Admin Review → Approve → Provision in Entra ID
     ↓
User Login Again → Check Entra ID → User Found → Dashboard → Click App → OIDC Flow → M365 Access
```


## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |
| `OIDC_ISSUER` | OIDC issuer URL | `https://bridge.safetynet.social` |
| `SESSION_SECRET` | Session encryption | `random-secure-string` |
| `ADMIN_PUBLIC_KEYS` | Admin DeSo public keys | `BC1YLh8...` (comma-separated) |
| `MICROSOFT_TENANT_ID` | Work Azure tenant ID | `73812cc6-...` |
| `MICROSOFT_CLIENT_ID` | Work app client ID | `c4ca15cc-...` |
| `MICROSOFT_CLIENT_SECRET` | Work app secret | `m3K8Q~w8...` |
| `MICROSOFT_EXTERNAL_TENANT_ID` | External Azure tenant ID | `xxxx-xxxx-xxxx` |
| `MICROSOFT_EXTERNAL_CLIENT_ID` | External app client ID | `xxxx-xxxx-xxxx` |
| `MICROSOFT_EXTERNAL_CLIENT_SECRET` | External app secret | `xxxx~xxxx` |


## Microsoft Graph Permissions

**Required Microsoft Graph API Permissions (Application):**

- To check users:
  - `User.Read.All`
  - `Directory.Read.All`
- To create/update users:
  - `User.ReadWrite.All`
  - `Directory.ReadWrite.All`

These must be granted as Application permissions and require admin consent in both tenants. Permissions should be restricted to the minimum required and only granted to the OIDC Bridge app registration in each tenant.

## Security Considerations

1. **Email Format**: All member emails are `username@safetynet.social` format and registered or existing in the Entra ID of the work tenant of SafetyNet. Any other email format is considered an external user and registered in the External Entra ID (auto-approved, no admin approval required).
2. **Admin Authorization**: Only approved DeSo public keys can approve new member registrations for the work tenant.
3. **Justification Required**: Minimum 50 characters to explain membership intent (work tenant only).
4. **Session Management**: Secure session cookies with httpOnly flag.
5. **HTTPS Required**: Production deployment must use HTTPS.
6. **Token Expiry**: Auth codes expire in 10 minutes, access tokens in 1 hour.
7. **Graph Permissions**: Microsoft Graph permissions must be restricted to the minimum required and granted only to the OIDC Bridge app registration in each tenant.

## Deployment

### Local Development
```bash
npm install
npm run dev
```

### Docker
```bash
docker build -t deso-oidc-bridge .
docker run -p 3000:3000 --env-file .env deso-oidc-bridge
```

### Azure (CI/CD via GitHub Actions)
- Push to `main` branch triggers automatic deployment
- Docker image built and pushed to Azure Container Registry
- Azure Web App automatically pulls and deploys latest image
- See [.github/DEPLOYMENT.md](.github/DEPLOYMENT.md) for setup

## Future Enhancements

- [ ] Redis for session persistence (multi-instance support)
- [ ] Azure Key Vault for RSA keys persistence
- [ ] Email notifications for approval status
- [ ] User dashboard to check registration status
- [ ] Automatic user provisioning in Entra ID on approval
- [ ] Webhook integration for real-time updates
- [ ] Rate limiting for registration submissions
- [ ] Audit logging for admin actions
