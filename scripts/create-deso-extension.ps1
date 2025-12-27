# This PowerShell script creates a schema extension for the DeSo handle in both Entra ID tenants.
# It prompts for admin credentials and tenant IDs, and uses Microsoft Graph PowerShell SDK.
# Requires: Microsoft.Graph module (Install-Module Microsoft.Graph -Scope CurrentUser)

param(
  [string]$ExtensionId = "desoHandle",
  [string]$Description = "DeSo handle for SafetyNet users",
  [string]$PropertyName = "desoHandle"
)

function Create-DesoSchemaExtension {
  param(
    [string]$TenantId
  )
  Write-Host "\n--- Creating schema extension in tenant: $TenantId ---" -ForegroundColor Cyan
  Write-Host "You will be prompted to sign in as a Global Admin for tenant $TenantId." -ForegroundColor Yellow
  Connect-MgGraph -TenantId $TenantId -Scopes "Directory.AccessAsUser.All"

  $body = @{
    id = $ExtensionId
    description = $Description
    targetTypes = @("User")
    properties = @(@{ name = $PropertyName; type = "String" })
  }

  try {
    $result = Invoke-MgGraphRequest -Method POST -Uri "/schemaExtensions" -Body ($body | ConvertTo-Json -Depth 5)
    Write-Host "Schema extension created: $($result.id)" -ForegroundColor Green
    Write-Host "Full attribute name: extension_$($result.id)_$PropertyName"
  } catch {
    Write-Host "Error creating schema extension: $_" -ForegroundColor Red
  }
  Disconnect-MgGraph
}

# Prompt for both tenant IDs
do {
  $tenant1 = Read-Host "Enter the first (work) tenant ID"
} while (-not $tenant1)
do {
  $tenant2 = Read-Host "Enter the second (external) tenant ID"
} while (-not $tenant2)

Create-DesoSchemaExtension -TenantId $tenant1
Create-DesoSchemaExtension -TenantId $tenant2

Write-Host "\nDone. Use the reported attribute names in your app config (DESO_EXTENSION_ATTR)." -ForegroundColor Yellow
