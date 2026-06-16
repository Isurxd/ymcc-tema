# install-node.ps1
$installDir = "E:\nodejs"
$zipPath = "E:\node-v20.12.2-win-x64.zip"
$downloadUrl = "https://nodejs.org/dist/v20.12.2/node-v20.12.2-win-x64.zip"

Write-Host "Creating installation directory: $installDir..."
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
}

Write-Host "Downloading Node.js from $downloadUrl..."
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing
    Write-Host "Download complete."
} catch {
    Write-Error "Failed to download Node.js: $_"
    exit 1
}

Write-Host "Extracting Node.js zip..."
try {
    $tempExtract = "E:\node-temp-extract"
    if (Test-Path $tempExtract) {
        Remove-Item -Recurse -Force $tempExtract
    }
    Expand-Archive -Path $zipPath -DestinationPath $tempExtract -Force
    
    Write-Host "Moving files to $installDir..."
    $extractedFolder = Get-ChildItem -Path $tempExtract | Select-Object -First 1
    Copy-Item -Path "$($extractedFolder.FullName)\*" -Destination $installDir -Recurse -Force
    
    Write-Host "Cleaning up temporary files..."
    Remove-Item -Recurse -Force $tempExtract
    Remove-Item -Force $zipPath
    
    Write-Host "Node.js successfully installed at $installDir!"
} catch {
    Write-Error "Failed to extract/install Node.js: $_"
    exit 1
}

# Test installation
$nodePath = Join-Path $installDir "node.exe"
if (Test-Path $nodePath) {
    Write-Host "Verifying installation..."
    $version = & $nodePath -v
    Write-Host "Installed Node version: $version"
    
    Write-Host "To run node/npm commands, add $installDir to your system environment PATH, or use absolute paths."
} else {
    Write-Error "Could not find node.exe after installation."
}
