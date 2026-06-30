Add-Type -AssemblyName System.Drawing

$PixelFormat32Argb = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb

$root = Split-Path $PSScriptRoot -Parent
$srcPath = Join-Path $root 'docs\readme-banner.png'
$destPath = Join-Path $root 'frontend\public\logo.png'

if (-not (Test-Path $srcPath)) {
    throw "Source not found: $srcPath"
}

function Test-IsBackground([System.Drawing.Color]$c, [int]$bgR, [int]$bgG, [int]$bgB) {
    $dr = $c.R - $bgR
    $dg = $c.G - $bgG
    $db = $c.B - $bgB
    $dist = [Math]::Sqrt($dr * $dr + $dg * $dg + $db * $db)

    # Тёплые/светлые пиксели — тело какашки, значок, лицо
    if ($c.R -gt 90 -and $c.R -gt ($c.B + 12)) { return $false }
    if ($c.R -gt 200 -and $c.G -gt 180) { return $false } # блики в глазах

    # Тёмный холодный фон баннера
    if ($c.R -lt 80 -and $c.G -lt 90 -and $c.B -lt 100 -and $c.B -ge ($c.R - 8)) {
        if ($dist -lt 55) { return $true }
    }

    return $dist -lt 32
}

function Get-BackgroundAlpha([System.Drawing.Color]$c, [int]$bgR, [int]$bgG, [int]$bgB) {
    $dr = $c.R - $bgR
    $dg = $c.G - $bgG
    $db = $c.B - $bgB
    $dist = [Math]::Sqrt($dr * $dr + $dg * $dg + $db * $db)

    if (Test-IsBackground $c $bgR $bgG $bgB) {
        if ($dist -lt 18) { return 0 }
        if ($dist -lt 42) { return [int](($dist - 18) / 24 * 255) }
    }
    return 255
}

$src = [System.Drawing.Image]::FromFile($srcPath)
$cropW = [int]($src.Width * 0.26)
$cropH = $src.Height
$cropX = 0
$cropY = 0

$raw = New-Object System.Drawing.Bitmap($cropW, $cropH, $PixelFormat32Argb)
$g = [System.Drawing.Graphics]::FromImage($raw)
$g.DrawImage($src, 0, 0, (New-Object System.Drawing.Rectangle $cropX, $cropY, $cropW, $cropH), [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$src.Dispose()

$bg = $raw.GetPixel(2, 2)
$bgR = $bg.R
$bgG = $bg.G
$bgB = $bg.B

for ($y = 0; $y -lt $raw.Height; $y++) {
    for ($x = 0; $x -lt $raw.Width; $x++) {
        $c = $raw.GetPixel($x, $y)
        $alpha = Get-BackgroundAlpha $c $bgR $bgG $bgB
        if ($alpha -eq 0) {
            $raw.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }
        elseif ($alpha -lt 255) {
            $raw.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))
        }
    }
}

$minX = $raw.Width
$minY = $raw.Height
$maxX = 0
$maxY = 0
for ($y = 0; $y -lt $raw.Height; $y++) {
    for ($x = 0; $x -lt $raw.Width; $x++) {
        if ($raw.GetPixel($x, $y).A -gt 12) {
            if ($x -lt $minX) { $minX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$pad = 4
$minX = [Math]::Max(0, $minX - $pad)
$minY = [Math]::Max(0, $minY - $pad)
$maxX = [Math]::Min($raw.Width - 1, $maxX + $pad)
$maxY = [Math]::Min($raw.Height - 1, $maxY + $pad)
$outW = $maxX - $minX + 1
$outH = $maxY - $minY + 1

$out = New-Object System.Drawing.Bitmap($outW, $outH, $PixelFormat32Argb)
$og = [System.Drawing.Graphics]::FromImage($out)
$og.Clear([System.Drawing.Color]::Transparent)
$og.DrawImage($raw, (New-Object System.Drawing.Rectangle 0, 0, $outW, $outH), (New-Object System.Drawing.Rectangle $minX, $minY, $outW, $outH), [System.Drawing.GraphicsUnit]::Pixel)
$og.Dispose()
$raw.Dispose()

$out.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$out.Dispose()

Write-Host "Transparent logo: ${outW}x${outH} -> $destPath"
