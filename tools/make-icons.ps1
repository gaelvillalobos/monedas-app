# Genera los iconos PNG de la app (moneda dorada sobre fondo noche).
# Uso:  powershell -ExecutionPolicy Bypass -File tools\make-icons.ps1
Add-Type -AssemblyName System.Drawing

$out = Join-Path $PSScriptRoot "..\www\icons"
if (-not (Test-Path $out)) { New-Item -ItemType Directory -Force $out | Out-Null }

function New-CoinIcon {
  param([int]$Size, [string]$Path, [double]$CoinRatio = 0.86)

  $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  # fondo
  $bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(36, 26, 91))
  $g.FillRectangle($bg, 0, 0, $Size, $Size)

  $d = [int]($Size * $CoinRatio)
  $x = [int](($Size - $d) / 2)

  # canto de la moneda
  $rim = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(217, 154, 0))
  $g.FillEllipse($rim, $x, $x, $d, $d)

  # cara de la moneda
  $inset = [int]($d * 0.075)
  $face = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 198, 41))
  $g.FillEllipse($face, $x + $inset, $x + $inset, $d - 2 * $inset, $d - 2 * $inset)

  # brillo arriba a la izquierda
  $shine = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(70, 255, 255, 255))
  $g.FillEllipse($shine, $x + [int]($d * 0.16), $x + [int]($d * 0.12), [int]($d * 0.34), [int]($d * 0.24))

  # simbolo
  $fs = [float]($d * 0.52)
  $font = New-Object System.Drawing.Font("Segoe UI", $fs, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $ink = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(90, 61, 0))
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = New-Object System.Drawing.RectangleF($x, ($x + $d * 0.02), $d, $d)
  $g.DrawString([char]0x0024, $font, $ink, $rect, $sf)

  $g.Dispose()
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output ("ok " + $Path)
}

New-CoinIcon -Size 192 -Path (Join-Path $out "icon-192.png")
New-CoinIcon -Size 512 -Path (Join-Path $out "icon-512.png")
New-CoinIcon -Size 180 -Path (Join-Path $out "apple-touch-icon-180.png")
# maskable: la moneda mas chica, dentro de la zona segura del 80%
New-CoinIcon -Size 512 -Path (Join-Path $out "icon-maskable-512.png") -CoinRatio 0.62
# recursos para el splash / icono nativo
New-CoinIcon -Size 1024 -Path (Join-Path $out "icon-1024.png")
