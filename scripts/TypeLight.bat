@echo off
title TypeLight
set "APP=C:\Projects\TypeLight"
set "PORT=5173"
set "URL=http://localhost:%PORT%/"

cd /d "%APP%" || (echo No encuentro %APP% & pause & exit /b 1)

rem Si el server ya esta corriendo, solo abrimos el navegador.
powershell -NoProfile -Command "try{$null=New-Object Net.Sockets.TcpClient('localhost',%PORT%); exit 0}catch{exit 1}"
if %errorlevel%==0 (
  echo El server ya esta corriendo. Abriendo %URL%
  start "" "%URL%"
  exit /b 0
)

if not exist node_modules (
  echo Instalando dependencias...
  call npm install || (pause & exit /b 1)
)

rem Reconstruye dist/ si falta o si master tiene un commit mas nuevo que el build.
rem (Sin bloques entre parentesis: las variables que se setean adentro no se leen en el mismo bloque.)
set "NEEDS_BUILD=0"
set "COMMIT_TS="
set "BUILD_TS="
if not exist dist\index.html set "NEEDS_BUILD=1"
if "%NEEDS_BUILD%"=="1" goto build
git log -1 --format=%%ct master > "%TEMP%\typelight-commit.txt"
set /p COMMIT_TS=<"%TEMP%\typelight-commit.txt"
if not defined COMMIT_TS set "NEEDS_BUILD=1"
if "%NEEDS_BUILD%"=="1" goto build
powershell -NoProfile -Command "[int]((Get-Item 'dist\index.html').LastWriteTimeUtc - [datetime]'1970-01-01').TotalSeconds" > "%TEMP%\typelight-build.txt"
set /p BUILD_TS=<"%TEMP%\typelight-build.txt"
if not defined BUILD_TS set "NEEDS_BUILD=1"
if "%NEEDS_BUILD%"=="1" goto build
if %BUILD_TS% LSS %COMMIT_TS% set "NEEDS_BUILD=1"
:build
if "%NEEDS_BUILD%"=="1" (
  echo Construyendo TypeLight...
  call npm run build || (pause & exit /b 1)
)

echo Sirviendo TypeLight en %URL% ...
echo Cerra esta ventana para apagar el server.
echo.
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 60;$i++){ try{$null=New-Object Net.Sockets.TcpClient('localhost',%PORT%); Start-Process '%URL%'; exit}catch{Start-Sleep -Milliseconds 500} }"
npm run serve
