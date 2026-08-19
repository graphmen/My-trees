# Deploy MyTrees to Firebase Hosting + Cloud Run (project mytree-c0641)
# Usage: from repo root,  powershell -ExecutionPolicy Bypass -File scripts/deploy-firebase.ps1

$ErrorActionPreference = "Stop"

# Avast HTTPS scanning breaks gcloud's Python SSL verify on this machine.
$env:CLOUDSDK_CORE_DISABLE_PROMPTS = "1"
$env:CLOUDSDK_AUTH_DISABLE_SSL_VALIDATION = "true"

$Project = "mytree-c0641"
$Region = "europe-west1"
$Service = "mytrees-api"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

function Assert-Command($Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name is not installed or not on PATH. Install Google Cloud SDK / Firebase CLI and retry."
    }
}

Write-Host "Checking CLIs..."
Assert-Command gcloud
$firebaseCmd = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCmd) {
    Write-Host "firebase CLI not found; will use npx firebase-tools"
    Assert-Command npx
}

Write-Host "Setting gcloud project $Project..."
gcloud config set project $Project | Out-Host

$account = gcloud auth list --filter=status:ACTIVE --format="value(account)"
if (-not $account) {
    throw "No active gcloud account. Run: gcloud auth login"
}
Write-Host "Using gcloud account: $account"

$billing = gcloud billing projects describe $Project --format="value(billingEnabled)" 2>$null
if ($billing -ne "True") {
    throw @"
Firebase/GCP project $Project does not have an OPEN billing account (Blaze).
A closed or missing billing account cannot run Cloud Run.
1. Open https://console.firebase.google.com/project/$Project/usage/details
2. Upgrade to Blaze and add a working payment method.
3. Re-run this script.
"@
}

Write-Host "Enabling required APIs..."
gcloud services enable `
    run.googleapis.com `
    artifactregistry.googleapis.com `
    cloudbuild.googleapis.com `
    secretmanager.googleapis.com `
    --project $Project | Out-Host

function Set-GcloudSecret([string]$Name, [string]$Value) {
    if ([string]::IsNullOrWhiteSpace($Value)) {
        Write-Host "Skipping secret $Name (empty)"
        return
    }
    $tmp = New-TemporaryFile
    try {
        [System.IO.File]::WriteAllText($tmp.FullName, $Value.Trim())
        $exists = $true
        gcloud secrets describe $Name --project $Project 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) { $exists = $false }
        if ($exists) {
            gcloud secrets versions add $Name --data-file=$tmp.FullName --project $Project | Out-Host
        } else {
            gcloud secrets create $Name --data-file=$tmp.FullName --project $Project | Out-Host
        }
    } finally {
        Remove-Item $tmp.FullName -Force -ErrorAction SilentlyContinue
    }
}

$configPath = Join-Path $RepoRoot "backend\qfield_cloud_config.json"
if (Test-Path $configPath) {
    Write-Host "Loading QField Cloud credentials from local config (not committed)..."
    $cfg = Get-Content $configPath -Raw | ConvertFrom-Json
    Set-GcloudSecret "QFIELD_USERNAME" $cfg.username
    Set-GcloudSecret "QFIELD_PASSWORD" $cfg.password
    Set-GcloudSecret "QFIELD_PROJECT_ID" $cfg.project_id
    if ($cfg.token) { Set-GcloudSecret "QFIELD_TOKEN" $cfg.token }
} else {
    Write-Host "No backend/qfield_cloud_config.json found. Using existing Secret Manager values if present."
}

$projectNumber = gcloud projects describe $Project --format="value(projectNumber)"
$computeSa = "$projectNumber-compute@developer.gserviceaccount.com"
foreach ($secretName in @("QFIELD_USERNAME", "QFIELD_PASSWORD", "QFIELD_PROJECT_ID", "QFIELD_TOKEN")) {
    gcloud secrets describe $secretName --project $Project 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        gcloud secrets add-iam-policy-binding $secretName `
            --member="serviceAccount:$computeSa" `
            --role="roles/secretmanager.secretAccessor" `
            --project $Project | Out-Host
    }
}

$secretPairs = @()
foreach ($secretName in @("QFIELD_USERNAME", "QFIELD_PASSWORD", "QFIELD_PROJECT_ID", "QFIELD_TOKEN")) {
    gcloud secrets describe $secretName --project $Project 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $secretPairs += "${secretName}=${secretName}:latest"
    }
}
if ($secretPairs.Count -eq 0) {
    throw "No QField secrets in Secret Manager. Add backend/qfield_cloud_config.json or create QFIELD_USERNAME / QFIELD_PASSWORD / QFIELD_PROJECT_ID secrets, then retry."
}

Write-Host "Deploying Cloud Run service $Service (this builds the GDAL image and can take several minutes)..."
$deployArgs = @(
    "run", "deploy", $Service,
    "--source", "backend",
    "--project", $Project,
    "--region", $Region,
    "--memory", "2Gi",
    "--cpu", "1",
    "--timeout", "3600",
    "--min-instances", "1",
    "--max-instances", "1",
    "--no-cpu-throttling",
    "--allow-unauthenticated",
    "--set-env-vars", "QFIELD_BASE_DIR=/tmp/MyTrees,QFIELD_URL=https://app.qfield.cloud/api/v1/",
    "--set-secrets", ($secretPairs -join ",")
)
& gcloud @deployArgs
if ($LASTEXITCODE -ne 0) { throw "Cloud Run deploy failed" }

Write-Host "Building frontend for same-origin /api..."
Push-Location (Join-Path $RepoRoot "frontend")
try {
    if (-not (Test-Path "node_modules")) {
        npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    }
    $env:VITE_BACKEND_URL = ""
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "frontend build failed" }
} finally {
    Pop-Location
}

Write-Host "Deploying Firebase Hosting..."
if ($firebaseCmd) {
    firebase deploy --only hosting --project $Project
} else {
    npx --yes firebase-tools deploy --only hosting --project $Project
}
if ($LASTEXITCODE -ne 0) { throw "Firebase Hosting deploy failed" }

Write-Host ""
Write-Host "Deploy complete."
Write-Host "Dashboard: https://$Project.web.app"
Write-Host "API via Hosting: https://$Project.web.app/api/kpis"
Write-Host "Cloud Run: https://console.cloud.google.com/run/detail/$Region/$Service/metrics?project=$Project"
