#requires -Version 5.1
<#
  fix-bucket-cors.ps1

  Browser uploads go straight to GCS, so the bucket's CORS must allow the
  resumable-upload protocol headers. This reads each bucket's CURRENT CORS,
  merges in the methods / response headers those uploads need (keeping the
  existing origins and any other entries untouched), and writes it back.

  Requires an authenticated gcloud. No other dependencies (uses built-in JSON).

  Usage:
    powershell -File scripts/fix-bucket-cors.ps1
    powershell -File scripts/fix-bucket-cors.ps1 -Buckets gs://my-saga-kyc
#>
param(
  [string[]]$Buckets = @("gs://my-saga-kyc", "gs://my-saga-adventures")
)

$ErrorActionPreference = "Stop"

# What resumable browser uploads need on top of whatever is already configured.
$addMethods = @("PUT", "POST", "GET", "HEAD")
$addHeaders = @("Content-Type", "Content-Range", "x-goog-resumable", "Location", "Range", "ETag")

foreach ($b in $Buckets) {
  Write-Host "== $b =="

  # --- copy: read the current CORS config ---
  $raw = (gcloud storage buckets describe $b --format=json | Out-String)
  $obj = $raw | ConvertFrom-Json

  $cors = $obj.cors_config
  if (-not $cors) { $cors = $obj.cors }
  if (-not $cors) {
    Write-Warning "No existing CORS on $b - cannot infer origins; set them manually first. Skipping."
    continue
  }
  $cors = @($cors)   # ConvertFrom-Json yields a bare object when there's one entry

  # --- edit: union in the missing methods / headers (case-insensitive), per entry ---
  foreach ($entry in $cors) {
    $methods = @()
    if ($entry.method) { $methods = @($entry.method) }
    foreach ($m in $addMethods) {
      if ($methods -notcontains $m) { $methods += $m }
    }
    $entry.method = $methods

    $headers = @()
    if ($entry.responseHeader) { $headers = @($entry.responseHeader) }
    foreach ($h in $addHeaders) {
      $exists = $false
      foreach ($e in $headers) { if ($e.ToLower() -eq $h.ToLower()) { $exists = $true; break } }
      if (-not $exists) { $headers += $h }
    }
    $entry.responseHeader = $headers

    if (-not $entry.maxAgeSeconds) { $entry.maxAgeSeconds = 3600 }
  }

  # --cors-file wants the bare array; ConvertTo-Json unwraps a 1-element array, so re-wrap.
  $jsonOut = $cors | ConvertTo-Json -Depth 10
  if ($cors.Count -eq 1) { $jsonOut = "[$jsonOut]" }

  Write-Host "New CORS:"
  Write-Host $jsonOut

  # --- update: write it back (UTF-8 without BOM so gcloud parses it) ---
  $tmp = [System.IO.Path]::GetTempFileName()
  [System.IO.File]::WriteAllText($tmp, $jsonOut)
  gcloud storage buckets update $b --cors-file=$tmp
  Remove-Item $tmp -Force

  Write-Host "Updated $b`n"
}
