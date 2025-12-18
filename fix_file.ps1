$lines = Get-Content 'd:\code\vavip2\frontend\src\pages\Home\index.tsx' -Encoding UTF8
$validLines = $lines[0..1318]
$validLines | Set-Content 'd:\code\vavip2\frontend\src\pages\Home\index.tsx' -Encoding UTF8

