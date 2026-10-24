Add-Type -AssemblyName System.Drawing
$taskRoot = Split-Path $PSScriptRoot -Parent
function Write-PixelRabbit([string]$relative,[int]$width,[int]$height,[double]$ratio,[bool]$transparent=$false) {
 $bitmap=New-Object System.Drawing.Bitmap($width,$height)
 $graphics=[System.Drawing.Graphics]::FromImage($bitmap)
 if($transparent){$graphics.Clear([System.Drawing.Color]::Transparent)}else{$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#f4f1e8'))}
 $side=[Math]::Min($width,$height)*$ratio;$scale=$side/80;$left=($width-$side)/2;$top=($height-$side)/2
 $rects=@(@(15,4,15,29,'#e2a9c8'),@(50,4,15,29,'#e2a9c8'),@(20,9,5,19,'#ffecf1'),@(55,9,5,19,'#ffecf1'),@(10,26,60,39,'#e2a9c8'),@(15,31,50,29,'#f6d5b7'),@(25,40,8,8,'#30314e'),@(47,40,8,8,'#30314e'),@(36,49,8,5,'#e9939e'),@(19,50,7,4,'#f3a3a8'),@(54,50,7,4,'#f3a3a8'),@(22,65,36,10,'#a6b9e3'))
 foreach($rect in $rects){$brush=New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($rect[4]));$graphics.FillRectangle($brush,[single]($left+$rect[0]*$scale),[single]($top+$rect[1]*$scale),[single]($rect[2]*$scale),[single]($rect[3]*$scale));$brush.Dispose()}
 $bitmap.Save((Join-Path $taskRoot $relative),[System.Drawing.Imaging.ImageFormat]::Png);$graphics.Dispose();$bitmap.Dispose()
}
foreach($density in @(@('mdpi',48,108),@('hdpi',72,162),@('xhdpi',96,216),@('xxhdpi',144,324),@('xxxhdpi',192,432))){foreach($name in @('ic_launcher','ic_launcher_round')){Write-PixelRabbit "android/app/src/main/res/mipmap-$($density[0])/$name.png" $density[1] $density[1] .72};Write-PixelRabbit "android/app/src/main/res/mipmap-$($density[0])/ic_launcher_foreground.png" $density[2] $density[2] .46 $true}
Write-PixelRabbit 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png' 1024 1024 .72
$taskSplashes=Get-ChildItem -LiteralPath (Join-Path $taskRoot 'android/app/src/main/res') -Recurse -Filter splash.png
foreach($file in $taskSplashes){$source=[System.Drawing.Image]::FromFile($file.FullName);$w=$source.Width;$h=$source.Height;$source.Dispose();Write-PixelRabbit $file.FullName.Substring($taskRoot.Length+1) $w $h .22}
foreach($name in @('splash-2732x2732-2.png','splash-2732x2732-1.png','splash-2732x2732.png')){Write-PixelRabbit "ios/App/App/Assets.xcassets/Splash.imageset/$name" 2732 2732 .22}
