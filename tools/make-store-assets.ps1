# Genera los materiales graficos para la ficha de Google Play.
#
#   powershell -ExecutionPolicy Bypass -File tools\make-store-assets.ps1
#     -> store\feature-graphic-1024x500.png   (obligatorio en Play)
#
#   powershell -ExecutionPolicy Bypass -File tools\make-store-assets.ps1 -Screenshots "C:\ruta\capturas"
#     -> toma las capturas que sacaste del celular y las deja en 1080x1920,
#        que es la proporcion que Play acepta (una captura de celular suele ser
#        mas alargada y la rechaza).
param(
  [string]$Screenshots = ""
)
Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$out = Join-Path $root "store"
if (-not (Test-Path $out)) { New-Item -ItemType Directory -Force $out | Out-Null }

$night = [System.Drawing.Color]::FromArgb(36, 26, 91)
$coinC = [System.Drawing.Color]::FromArgb(255, 198, 41)
$rimC = [System.Drawing.Color]::FromArgb(217, 154, 0)
$cream = [System.Drawing.Color]::FromArgb(255, 248, 231)

function New-FeatureGraphic {
  $W = 1024; $H = 500
  $bmp = New-Object System.Drawing.Bitmap($W, $H)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  # fondo con un degrade suave
  $rect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
  $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect, [System.Drawing.Color]::FromArgb(28, 20, 72), [System.Drawing.Color]::FromArgb(59, 42, 140), 15)
  $g.FillRectangle($grad, $rect)

  # moneda grande a la izquierda
  $d = 320; $cx = 105; $cy = ($H - $d) / 2
  $shadow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(60, 0, 0, 0))
  $g.FillEllipse($shadow, $cx + 8, $cy + 18, $d, $d)
  $g.FillEllipse((New-Object System.Drawing.SolidBrush $rimC), $cx, $cy, $d, $d)
  $inset = [int]($d * 0.075)
  $g.FillEllipse((New-Object System.Drawing.SolidBrush $coinC), $cx + $inset, $cy + $inset, $d - 2 * $inset, $d - 2 * $inset)
  $g.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(70, 255, 255, 255))),
    $cx + [int]($d * 0.16), $cy + [int]($d * 0.12), [int]($d * 0.34), [int]($d * 0.24))

  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $fSign = New-Object System.Drawing.Font("Segoe UI", [float]($d * 0.52), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString([char]0x0024, $fSign, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(90, 61, 0))),
    (New-Object System.Drawing.RectangleF($cx, ($cy + $d * 0.02), $d, $d)), $sf)

  # textos a la derecha
  $left = New-Object System.Drawing.StringFormat
  $left.Alignment = [System.Drawing.StringAlignment]::Near
  $fTitle = New-Object System.Drawing.Font("Segoe UI", 86, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $fSub = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString("Monedas", $fTitle, (New-Object System.Drawing.SolidBrush $cream), 470, 150, $left)
  $g.DrawString("Educación financiera", $fSub, (New-Object System.Drawing.SolidBrush $coinC), 476, 262, $left)
  $g.DrawString("para chicos", $fSub, (New-Object System.Drawing.SolidBrush $coinC), 476, 304, $left)

  $p = Join-Path $out "feature-graphic-1024x500.png"
  $g.Dispose(); $bmp.Save($p, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
  Write-Output "ok $p"
}

function Convert-Screenshot {
  param([string]$Path, [string]$Dest)
  $TW = 1080; $TH = 1920
  $src = [System.Drawing.Image]::FromFile($Path)
  $bmp = New-Object System.Drawing.Bitmap($TW, $TH)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.Clear($night)
  # entra completa, centrada, con el fondo de la app rellenando lo que sobra
  $scale = [Math]::Min($TW / $src.Width, $TH / $src.Height)
  $w = [int]($src.Width * $scale); $h = [int]($src.Height * $scale)
  $g.DrawImage($src, [int](($TW - $w) / 2), [int](($TH - $h) / 2), $w, $h)
  $g.Dispose(); $src.Dispose()
  $bmp.Save($Dest, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
  Write-Output "ok $Dest"
}

New-FeatureGraphic

if ($Screenshots -ne "") {
  if (-not (Test-Path $Screenshots)) { Write-Output "No existe la carpeta $Screenshots"; exit 1 }
  $shots = Join-Path $out "screenshots"
  if (-not (Test-Path $shots)) { New-Item -ItemType Directory -Force $shots | Out-Null }
  $i = 1
  Get-ChildItem $Screenshots -Include *.png, *.jpg, *.jpeg -File -Recurse | Sort-Object Name | ForEach-Object {
    Convert-Screenshot -Path $_.FullName -Dest (Join-Path $shots ("captura-{0:d2}.png" -f $i))
    $i++
  }
}
