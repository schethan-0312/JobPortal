$connections = @(100, 500, 1000, 2000, 5000, 10000)
$duration = 10
$url = "http://localhost:4000/api/jobs"

Write-Host "Starting load tests on $url..."

foreach ($c in $connections) {
    Write-Host "`n==============================================="
    Write-Host "Testing with $c concurrent connections..."
    $output = npx autocannon -c $c -d $duration $url | Out-String
    Write-Host $output
    
    if ($output -match "timeouts" -and -not ($output -match "0 timeouts")) {
        Write-Host "WARNING: Server started timing out connections." -ForegroundColor Yellow
        break
    }
}
