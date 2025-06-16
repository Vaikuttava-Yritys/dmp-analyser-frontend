# PowerShell script to generate env.js from .env file
# Create js directory if it doesn't exist
if (-not (Test-Path -Path "js")) {
    New-Item -ItemType Directory -Path "js" | Out-Null
}

# Create a hashtable to store environment variables
$envVars = @{}

# Read .env file and convert to hashtable
Get-Content .env | Where-Object { 
    # Skip comments and empty lines
    $_ -match "^[^#]" -and $_ -match "=" -and $_ -notmatch "SECRET" -and $_ -notmatch "MONGODB" 
} | ForEach-Object {
    # Split the line into key and value
    $key, $value = $_ -split "=", 2
    
    # Handle array values (like ALLOWED_ORIGINS)
    if ($value -match "^\[.*\]$") {
        # It's already in JSON array format, store as is
        $envVars[$key] = $value
    } else {
        # Regular string value
        $envVars[$key] = $value
    }
}

# Convert hashtable to JSON
$jsonContent = $envVars | ConvertTo-Json

# Format the JSON to be a JavaScript object
$jsContent = "window.ENV = $jsonContent;"

# Write to file
$jsContent | Out-File -FilePath "env.js" -Encoding utf8

Write-Host "Generated env.js from .env file"
