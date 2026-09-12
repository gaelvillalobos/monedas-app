# Servidor estatico minimo para probar la app sin instalar nada.
#   powershell -ExecutionPolicy Bypass -File tools\serve.ps1
#   powershell -ExecutionPolicy Bypass -File tools\serve.ps1 -Lan    (para abrirla desde el celular)
# Cortar con Ctrl+C.
param(
  [int]$Port = 5173,
  [switch]$Lan   # escucha en toda la red local; hay que correrlo como administrador
)

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\www")).Path
$prefix = if ($Lan) { "http://+:$Port/" } else { "http://localhost:$Port/" }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
try { $listener.Start() }
catch {
  Write-Output "No se pudo escuchar en $prefix"
  if ($Lan) { Write-Output "Con -Lan hay que abrir PowerShell como administrador." }
  exit 1
}

$types = @{
  ".html" = "text/html; charset=utf-8"; ".css" = "text/css; charset=utf-8";
  ".js" = "text/javascript; charset=utf-8"; ".json" = "application/json; charset=utf-8";
  ".webmanifest" = "application/manifest+json; charset=utf-8"; ".png" = "image/png";
  ".svg" = "image/svg+xml"; ".ico" = "image/x-icon"; ".woff2" = "font/woff2"
}

Write-Output "Sirviendo $root"
Write-Output "  -> http://localhost:$Port/"
if ($Lan) {
  Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } |
    ForEach-Object { Write-Output ("  -> http://" + $_.IPAddress + ":$Port/  (desde el celular)") }
}
Write-Output "Ctrl+C para cortar."

while ($listener.IsListening) {
  try { $ctx = $listener.GetContext() } catch { break }
  $path = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
  if ($path -eq "/") { $path = "/index.html" }
  $file = Join-Path $root ($path.TrimStart("/") -replace "/", "\")

  # no salir de www
  $full = [System.IO.Path]::GetFullPath($file)
  if (-not $full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $full -PathType Leaf)) {
    $ctx.Response.StatusCode = 404
    $body = [System.Text.Encoding]::UTF8.GetBytes("404")
  } else {
    $ext = [System.IO.Path]::GetExtension($full).ToLower()
    $ctx.Response.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { "application/octet-stream" }
    $ctx.Response.Headers.Add("Cache-Control", "no-store")
    $body = [System.IO.File]::ReadAllBytes($full)
  }
  $ctx.Response.ContentLength64 = $body.Length
  $ctx.Response.OutputStream.Write($body, 0, $body.Length)
  $ctx.Response.OutputStream.Close()
}
$listener.Stop()
