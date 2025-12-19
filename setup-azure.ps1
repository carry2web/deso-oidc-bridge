# Azure Container Registry Setup Script
# Run this once to create ACR and configure App Service

$resourceGroup = "bridge"
$location = "westeurope"
$registryName = "desooiidcbridge"
$appName = "deso-oidc-bridge"
$appServicePlan = "bridge-plan"

Write-Host "Setting up Azure Container Registry..." -ForegroundColor Cyan

# Create ACR if it doesn't exist
Write-Host "Creating Azure Container Registry..." -ForegroundColor Yellow
az acr create `
  --resource-group $resourceGroup `
  --name $registryName `
  --sku Basic `
  --admin-enabled true `
  --location $location

# Get ACR credentials
Write-Host "Getting ACR credentials..." -ForegroundColor Yellow
$acrUsername = az acr credential show --name $registryName --query "username" -o tsv
$acrPassword = az acr credential show --name $registryName --query "passwords[0].value" -o tsv
$acrUrl = "$registryName.azurecr.io"

Write-Host "✓ ACR Created: $acrUrl" -ForegroundColor Green

# Create App Service if it doesn't exist
Write-Host "Creating App Service..." -ForegroundColor Yellow
$appExists = az webapp show --name $appName --resource-group $resourceGroup 2>$null

if (!$appExists) {
    az webapp create `
      --resource-group $resourceGroup `
      --plan $appServicePlan `
      --name $appName `
      --deployment-container-image-name "$acrUrl/deso-oidc-express:latest"
}

# Configure App Service for container
Write-Host "Configuring App Service..." -ForegroundColor Yellow
az webapp config container set `
  --name $appName `
  --resource-group $resourceGroup `
  --docker-custom-image-name "$acrUrl/deso-oidc-express:latest" `
  --docker-registry-server-url "https://$acrUrl" `
  --docker-registry-server-user $acrUsername `
  --docker-registry-server-password $acrPassword

# Configure environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow
az webapp config appsettings set `
  --name $appName `
  --resource-group $resourceGroup `
  --settings `
    OIDC_ISSUER="https://$appName.azurewebsites.net" `
    SESSION_SECRET="$(New-Guid)" `
    ADMIN_PUBLIC_KEYS="BC1YLh8heSjLGcmd7k8p2L4C63r4PhGCdESTcVNDDvTbrrP8NaidpTF" `
    NODE_ENV="production"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "✓ Azure setup complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Add these secrets to your GitHub repository:" -ForegroundColor Cyan
Write-Host "Settings → Secrets and variables → Actions → New repository secret" -ForegroundColor Gray
Write-Host ""
Write-Host "REGISTRY_URL=$acrUrl" -ForegroundColor Yellow
Write-Host "REGISTRY_USERNAME=$acrUsername" -ForegroundColor Yellow
Write-Host "REGISTRY_PASSWORD=$acrPassword" -ForegroundColor Yellow
Write-Host ""
Write-Host "App URL: https://$appName.azurewebsites.net" -ForegroundColor Cyan
Write-Host ""

# Copy to clipboard
"REGISTRY_URL=$acrUrl`nREGISTRY_USERNAME=$acrUsername`nREGISTRY_PASSWORD=$acrPassword" | Set-Clipboard
Write-Host "✓ ACR credentials copied to clipboard!" -ForegroundColor Green
