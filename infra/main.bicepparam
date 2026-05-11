using './main.bicep'

// Override these values for your deployment.
// acrName must be globally unique and contain only lowercase letters and digits.

param location = 'eastus'
param appName = 'webrtc-call'
param acrName = 'webrtccallacr'   // ← change to a unique name before first deploy
param imageTag = 'latest'
