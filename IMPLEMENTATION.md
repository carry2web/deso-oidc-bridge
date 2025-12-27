## 🏷️ Adding the `extension_desoHandle` Attribute to Entra ID (Work & External Tenants)

To store the DeSo handle for both members (work tenant) and guests (external tenant), you must add a custom directory extension attribute to each Entra ID tenant. This attribute will be used as `extension_desoHandle` in the app code.

### Step 1: Register an Application (if not already done)
1. Go to [Entra Admin Center](https://entra.microsoft.com/) for each tenant.
2. Navigate to **Entra ID** > **App registrations** > **New registration**.
3. Register your OIDC Bridge app (or use the existing one).

### Step 2: Add a Directory Schema Extension
1. In the Azure Portal, go to **Azure Active Directory** > **App registrations** > select your app > **Manifest**.
2. Add a new `"extension_desoHandle"` property to the `"optionalClaims"` or use the [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/api/schemaextension-post-schemaextensions) to create a schema extension. Example Graph API call:

```
POST https://graph.microsoft.com/v1.0/schemaExtensions
Content-Type: application/json
{
  "id": "desoHandle",
  "description": "DeSo handle for SafetyNet users",
  "targetTypes": ["User"],
  "properties": [
    { "name": "desoHandle", "type": "String" }
  ]
}
```
*Note: The resulting attribute will be named `extension_<appId>_desoHandle` in Graph and Azure AD. Set the ENV variable `DESO_EXTENSION_ATTR` to this value in your app config.*

### Step 3: Grant API Permissions
1. Grant `User.ReadWrite.All` and `Directory.ReadWrite.All` to your app registration in both tenants.
2. Admin consent is required.

### Step 4: Use the Attribute in Code
- The backend will now set and update the DeSo handle for each user in both tenants using this attribute.
- The claims provider endpoint can return this value as a custom claim.

---
# Implementation Summary

## ✅ Completed Changes

### 1. Authentication Flow Updated
- **DeSo login** now automatically checks if `desohandle@safetynet.social` exists in Entra ID
- **Existing users** get automatic OIDC login to Microsoft 365
- **New users** are redirected to registration with justification requirement

### 2. Registration Form Enhanced
### 1. Authentication Flow Updated
- **DeSo login** now checks if `desohandle@safetynet.social` exists in the work tenant (Entra ID). Any other email is checked in the external tenant.
- **Existing users** (in either tenant) get automatic OIDC login to Microsoft 365
- **New users**:
  - If @safetynet.social: redirected to registration with justification and admin approval required
  - If external: registration is auto-approved, no admin approval required

### 3. Admin Dashboard Improved
### 2. Registration Form Enhanced
- Added **justification textarea** (minimum 50 characters required for @safetynet.social only)
- Email field auto-fills as `username@safetynet.social` (readonly for work tenant)
- Clear messaging about SafetyNet.Social membership and approval requirements

### 4. CI/CD Deployment Setup
### 3. Admin Dashboard Improved
- Displays **justification text** for each registration request (work tenant only)
- Styled justification in readable format
- Admins can approve/reject with full context (work tenant only)
- External tenant registrations are auto-approved and do not appear for admin review
- Environment protection and manual dispatch options

### 6. [README.md](README.md) - Updated with new flow and features

### Multi-Tenant Support
- [lib/graphClient.js](lib/graphClient.js) now selects the correct Microsoft tenant and app credentials based on the email domain.
- Work tenant (@safetynet.social): registration requires admin approval.
- External tenant (other emails): registration is auto-approved.
### 5. Documentation Created
- **README.md** - Updated with authentication flow and SafetyNet.Social branding
- **ARCHITECTURE.md** - Complete system architecture with flow diagrams
- **.github/DEPLOYMENT.md** - Comprehensive Azure CI/CD setup guide

## 📋 File Changes

### Modified Files:
1. [routes/auth.js](routes/auth.js) - Enhanced login flow with Entra ID checking
2. [routes/admin.js](routes/admin.js) - Added justification field and duplicate check
3. [public/register.html](public/register.html) - Added justification textarea
4. [public/admin.html](public/admin.html) - Display justification in approval UI
MICROSOFT_EXTERNAL_TENANT_ID=<external-tenant-id>
MICROSOFT_EXTERNAL_CLIENT_ID=<external-client-id>
MICROSOFT_EXTERNAL_CLIENT_SECRET=<external-client-secret>
5. [.github/workflows/main_deso-oidc-bridge.yml](.github/workflows/main_deso-oidc-bridge.yml) - Enhanced CI/CD workflow
6. [README.md](README.md) - Updated with new flow and features

### Created Files:
1. [.github/DEPLOYMENT.md](.github/DEPLOYMENT.md) - Azure deployment guide
#### Test as Existing User (Work or External Tenant):
1. Login with DeSo Identity at `/login.html`
2. If username exists in the correct Entra ID tenant → Should auto-login via OIDC
2. [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture documentation

## 🚀 Next Steps to Complete Setup

### 1. Configure GitHub Secrets
Add these secrets to your GitHub repository (Settings → Secrets → Actions):

```
REGISTRY_URL=<your-acr-name>.azurecr.io
- **@safetynet.social**:
  1. Login with DeSo Identity at `/login.html`
  2. Redirected to `/register.html`
  3. Fill out justification (min 50 chars)
  4. Submit membership request
  5. Admin reviews at `/admin.html`
  6. Admin approves → User provisioned in Entra ID
  7. User logs in again → Auto-login works
- **External email**:
  1. Login with DeSo Identity at `/login.html`
  2. Registration is auto-approved, no admin review required
  3. User is granted access immediately
REGISTRY_USERNAME=<acr-admin-username>
REGISTRY_PASSWORD=<acr-admin-password>
## 🔒 Security Features

- ✅ Email format enforced: `username@safetynet.social` for work tenant, any other for external
- ✅ Admin authorization via DeSo public keys (work tenant only)
- ✅ Minimum 50 character justification (work tenant only)
- ✅ Duplicate registration prevention
- ✅ Secure session management
- ✅ HTTPS required in production
- ✅ Token expiry (10 min auth codes, 1 hour access tokens)
- ✅ Microsoft Graph permissions restricted to minimum required and granted only to the OIDC Bridge app registration in each tenant

## Microsoft Graph Permissions

**Required Microsoft Graph API Permissions (Application):**

- To check users:
  - `User.Read.All`
  - `Directory.Read.All`
- To create/update users:
  - `User.ReadWrite.All`
  - `Directory.ReadWrite.All`

These must be granted as Application permissions and require admin consent in both tenants.
az ad sp create-for-rbac \
  --name "deso-oidc-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth
```

### 2. Configure Azure Web App Environment Variables
In Azure Portal → Your Web App → Configuration → Application settings:

```
PORT=3000
NODE_ENV=production
OIDC_ISSUER=https://<your-webapp-name>.azurewebsites.net
SESSION_SECRET=<generate-secure-random-string>
ADMIN_PUBLIC_KEYS=<comma-separated-deso-public-keys>
MICROSOFT_TENANT_ID=<your-tenant-id>
MICROSOFT_CLIENT_ID=<your-client-id>
MICROSOFT_CLIENT_SECRET=<your-client-secret>
```

### 3. Push to GitHub
```bash
git add .
git commit -m "feat: Add SafetyNet.Social auth flow with justification and CI/CD"
git push origin main
```

The GitHub Actions workflow will automatically:
- Build Docker image
- Push to Azure Container Registry
- Deploy to Azure Web App
- Restart the application

### 4. Test the Flow

#### Test as Existing User:
1. Login with DeSo Identity at `/login.html`
2. If username exists in Entra ID → Should auto-login via OIDC

#### Test as New User:
1. Login with DeSo Identity at `/login.html`
2. Redirected to `/register.html`
3. Fill out justification (min 50 chars)
4. Submit membership request
5. Admin reviews at `/admin.html`
6. Admin approves → User provisioned in Entra ID
7. User logs in again → Auto-login works

## 📊 System Flow Summary


```
User with DeSo Identity
         ↓
    Login Button
         ↓
  Check Entra ID (Work & External)
    /                \
   YES                NO
    ↓                  ↓
Auto-Login         Registration Form
  OIDC         (Choose Member or Guest)
    ↓                  ↓
Microsoft        ┌───────────────┐
  365            │  Member:      │
                 │  - Justify    │
                 │  - Email =    │
                 │    desohandle@│
                 │    safetynet. │
                 │    social     │
                 │  - Admin      │
                 │    Approval   │
                 └───────────────┘
                 ┌───────────────┐
                 │  Guest:       │
                 │  - Any Email  │
                 │  - Auto-      │
                 │    Approved   │
                 └───────────────┘
                     ↓
         Store DeSo handle as custom attribute
         (in Entra ID: member=work, guest=external)
                     ↓
         ┌───────────────┐
         │  Member:      │
         │  - Admin      │
         │    Review     │
         │  - Provision  │
         │    in Entra   │
         └───────────────┘
         ┌───────────────┐
         │  Guest:       │
         │  - Provision  │
         │    in Entra   │
         └───────────────┘
                     ↓
                Auto-Login
                Next Time
```

## 🔒 Security Features

- ✅ Email format enforced: `username@safetynet.social`
- ✅ Admin authorization via DeSo public keys
- ✅ Minimum 50 character justification
- ✅ Duplicate registration prevention
- ✅ Secure session management
- ✅ HTTPS required in production
- ✅ Token expiry (10 min auth codes, 1 hour access tokens)

## 🎯 Key Benefits

1. **Seamless Experience**: Existing members get instant access
2. **Quality Control**: Justification ensures serious membership requests
3. **Admin Oversight**: Full visibility into why users want to join
4. **Automated Deployment**: Push to GitHub → Automatic Azure deployment
5. **Scalable**: Docker-based deployment ready for production
6. **Compliant**: OIDC 1.0 standard for Microsoft 365 integration

## 📖 Documentation

- [README.md](README.md) - Quick start and features
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design and flow diagrams
- [.github/DEPLOYMENT.md](.github/DEPLOYMENT.md) - Azure CI/CD setup guide
- [.env.example](.env.example) - Configuration template

## 🆘 Support & Troubleshooting

See [.github/DEPLOYMENT.md#troubleshooting](.github/DEPLOYMENT.md#troubleshooting) for common issues and solutions.
