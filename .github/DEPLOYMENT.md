# Azure CI/CD Deployment Guide

This guide explains how to set up automated deployment from GitHub to Azure using GitHub Actions.

## Prerequisites

1. Azure subscription with permissions to create resources
2. GitHub repository with this code
3. Azure CLI installed (for initial setup)

## Setup Steps

### 1. Create Azure Resources

Run the PowerShell setup script to create necessary Azure resources:

```powershell
.\setup-azure.ps1
```

This creates:
- Azure Container Registry (ACR)
- Azure App Service Plan
- Azure Web App
- Service Principal for GitHub Actions

### 2. Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions → New repository secret):

#### Required Secrets:

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `REGISTRY_URL` | Azure Container Registry URL | `<your-acr-name>.azurecr.io` |
| `REGISTRY_USERNAME` | ACR username | From Azure Portal → ACR → Access keys |
| `REGISTRY_PASSWORD` | ACR password | From Azure Portal → ACR → Access keys |
| `AZURE_WEBAPP_NAME` | Web App name | Name you created in Azure |
| `AZURE_RESOURCE_GROUP` | Resource group name | Name you created in Azure |
| `AZURE_CREDENTIALS` | Service Principal JSON | Output from setup script (see below) |

#### Getting Azure Credentials:

Create a service principal with contributor access:

```bash
az ad sp create-for-rbac \
  --name "deso-oidc-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth
```

Copy the entire JSON output and paste it as the `AZURE_CREDENTIALS` secret.

### 3. Configure Azure Web App Environment Variables

In Azure Portal → Your Web App → Configuration → Application settings, add:

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

### 4. Enable Continuous Deployment

In Azure Portal → Your Web App → Deployment Center:
- Select "Container Registry" as the source
- Configure to pull from your ACR
- Enable "Continuous Deployment" webhook

## How It Works

1. **Trigger**: Push to `main` branch or manual workflow dispatch
2. **Build**: Docker image built with caching for faster builds
3. **Push**: Image pushed to Azure Container Registry with commit SHA and `latest` tags
4. **Deploy**: Azure Web App automatically pulls and deploys the latest image
5. **Restart**: Web App restarted to ensure new image is loaded

## Workflow Features

- ✅ Multi-platform Docker builds (linux/amd64)
- ✅ Docker layer caching for faster builds
- ✅ Tagged with commit SHA for traceability
- ✅ Automatic Web App restart after deployment
- ✅ Environment protection (production)
- ✅ Manual workflow dispatch option

## Manual Deployment

To manually trigger a deployment:
1. Go to GitHub → Actions → Deploy to Azure Web App
2. Click "Run workflow"
3. Select branch and confirm

## Monitoring

- **GitHub Actions**: View build logs in the Actions tab
- **Azure Portal**: Monitor deployment and runtime logs in Log Stream
- **Container Logs**: `az webapp log tail --name <webapp-name> --resource-group <resource-group>`

## Rollback

To rollback to a previous version:

```bash
# Find previous image SHA from GitHub Actions history
docker pull <registry>.azurecr.io/deso-oidc-bridge:<previous-sha>
docker tag <registry>.azurecr.io/deso-oidc-bridge:<previous-sha> <registry>.azurecr.io/deso-oidc-bridge:latest
docker push <registry>.azurecr.io/deso-oidc-bridge:latest

# Restart the web app
az webapp restart --name <webapp-name> --resource-group <resource-group>
```

## Troubleshooting

### Build Fails
- Check GitHub Actions logs for error details
- Verify Dockerfile syntax and dependencies
- Ensure all secrets are correctly configured

### Deployment Successful but App Not Working
- Check Azure Web App logs: Azure Portal → Log Stream
- Verify environment variables in Application Settings
- Check that PORT matches Azure's expected port (3000)
- Review OIDC_ISSUER matches your actual domain

### Container Registry Login Fails
- Verify `REGISTRY_PASSWORD` is the admin password, not access key
- Ensure Admin user is enabled in ACR → Access keys
- Check `REGISTRY_URL` format: `<name>.azurecr.io` (no https://)

### Web App Not Pulling Latest Image
- Ensure webhook is enabled in Deployment Center
- Manually restart: `az webapp restart`
- Check ACR webhook delivery history

## Security Best Practices

1. ✅ Never commit secrets to repository
2. ✅ Use GitHub environment protection rules
3. ✅ Rotate `SESSION_SECRET` regularly
4. ✅ Use Azure Key Vault for sensitive values (advanced)
5. ✅ Enable Azure Web App authentication
6. ✅ Review GitHub Actions logs for exposed secrets

## Cost Optimization

- Use B1 tier App Service Plan for development (~$13/month)
- Use P1v2 tier for production (~$73/month)
- Basic ACR tier sufficient for most use cases (~$5/month)
- Enable auto-scaling for production workloads

## Next Steps

1. Set up staging environment with separate workflow
2. Add automated testing before deployment
3. Configure custom domain and SSL certificate
4. Set up Azure Application Insights for monitoring
5. Implement blue-green deployment strategy
