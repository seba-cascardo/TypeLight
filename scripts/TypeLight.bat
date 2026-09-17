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

rem Reconstruye dist/ si falta o si master avanzo desde el ultimo build (dist\.commit guarda el commit buildeado).
rem Si el checkout esta en otra rama, se sirve el ultimo build de master sin reconstruir (las ramas se prueban en :5175).
set "NEEDS_BUILD=0"
set "MASTER_SHA="
set "BUILT_SHA="
set "BRANCH="
for /f %%h in ('git rev-parse master') do set "MASTER_SHA=%%h"
for /f %%b in ('git rev-parse --abbrev-ref HEAD') do set "BRANCH=%%b"
if not exist dist\index.html set "NEEDS_BUILD=1"
if not exist dist\.commit set "NEEDS_BUILD=1"
if "%NEEDS_BUILD%"=="1" goto decide
set /p BUILT_SHA=<dist\.commit
if not defined BUILT_SHA set "NEEDS_BUILD=1"
if not "%BUILT_SHA%"=="%MASTER_SHA%" set "NEEDS_BUILD=1"
:decide
if not "%BRANCH%"=="master" (
  echo Atencion: el checkout esta en la rama %BRANCH%, no en master.
)
if not "%BRANCH%"=="master" if exist dist\index.html (
  echo Se sirve el ultimo build de master sin reconstruir. Para probar la rama usa npm run dev -- --port 5175
  set "NEEDS_BUILD=0"
)
if "%NEEDS_BUILD%"=="1" (
  echo Construyendo TypeLight...
  call npm run build || (pause & exit /b 1)
  for /f %%h in ('git rev-parse HEAD') do >dist\.commit echo %%h
)

echo Sirviendo TypeLight en %URL% ...
echo Cerra esta ventana para apagar el server.
echo.
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 120;$i++){ try{$null=New-Object Net.Sockets.TcpClient('localhost',%PORT%); Start-Process '%URL%'; exit}catch{Start-Sleep -Milliseconds 500} }"
npm run serve
