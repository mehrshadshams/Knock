@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Base name used for the Container App and related resources')
param appName string = 'webrtc-call'

@description('Name of the Azure Container Registry (must be globally unique, alphanumeric only)')
param acrName string = 'webrtccallacr'

@description('Container image tag to deploy')
param imageTag string = 'latest'

// ── Azure Container Registry ─────────────────────────────────────────────────
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
  }
}

// ── Container Apps Environment ───────────────────────────────────────────────
resource caEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${appName}-env'
  location: location
  properties: {
    // Consumption workload profile — no dedicated infrastructure needed for MVP
  }
}

// ── Container App ────────────────────────────────────────────────────────────
resource ca 'Microsoft.App/containerApps@2023-05-01' = {
  name: appName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: caEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'   // HTTP/1.1 — required for WebSocket upgrades
        allowInsecure: false
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: 'system'
        }
      ]
    }
    template: {
      containers: [
        {
          name: appName
          image: '${acr.properties.loginServer}/${appName}:${imageTag}'
          env: [
            {
              name: 'PORT'
              value: '3000'
            }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

// ── AcrPull role assignment — Container App managed identity → ACR ────────────
// Built-in AcrPull role ID (constant across all Azure tenants)
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'

resource acrPullAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, appName, acrPullRoleId)
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalId: ca.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── Outputs ───────────────────────────────────────────────────────────────────
@description('Public FQDN of the deployed Container App')
output fqdn string = ca.properties.configuration.ingress.fqdn

@description('ACR login server URL')
output acrLoginServer string = acr.properties.loginServer
