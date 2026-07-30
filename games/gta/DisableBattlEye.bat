@echo off
setlocal enableextensions enabledelayedexpansion
title GTA V - Disable BattlEye  ^|  whatwhatboy

:: ---- self-elevate to administrator ----
>nul 2>&1 net session
if %errorlevel% neq 0 (
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs" >nul 2>&1
    exit /b
)

color 0d
echo(
echo   ==================================================
echo     GTA V  -  Disable BattlEye   ^(-nobattleye^)
echo     by whatwhatboy
echo   ==================================================
echo(
echo   [*] Looking for your GTA V installation...
echo(

set "GTADIR="

:: 1) Rockstar Games Launcher / retail registry keys
for %%K in (
    "HKLM\SOFTWARE\WOW6432Node\Rockstar Games\Grand Theft Auto V"
    "HKLM\SOFTWARE\Rockstar Games\Grand Theft Auto V"
) do if not defined GTADIR call :chkreg %%K

:: 2) common default install paths (Rockstar / Steam / Epic)
if not defined GTADIR call :chkdir "%ProgramFiles%\Rockstar Games\Grand Theft Auto V"
if not defined GTADIR call :chkdir "%ProgramFiles(x86)%\Rockstar Games\Grand Theft Auto V"
if not defined GTADIR call :chkdir "%ProgramFiles(x86)%\Steam\steamapps\common\Grand Theft Auto V"
if not defined GTADIR call :chkdir "%ProgramFiles%\Steam\steamapps\common\Grand Theft Auto V"
if not defined GTADIR call :chkdir "%ProgramFiles%\Epic Games\GTAV"
if not defined GTADIR call :chkdir "%ProgramFiles(x86)%\Epic Games\GTAV"

:: 3) Xbox App / Microsoft Store default (XboxGames folder) on each drive
if not defined GTADIR for %%D in (C D E F G H I J) do if not defined GTADIR call :chkdir "%%D:\XboxGames\Grand Theft Auto V\Content"

:: 4) common Steam library folder names on each drive
if not defined GTADIR for %%D in (C D E F G H I J) do (
    if not defined GTADIR call :chkdir "%%D:\SteamLibrary\steamapps\common\Grand Theft Auto V"
    if not defined GTADIR call :chkdir "%%D:\Steam\steamapps\common\Grand Theft Auto V"
    if not defined GTADIR call :chkdir "%%D:\Games\steamapps\common\Grand Theft Auto V"
    if not defined GTADIR call :chkdir "%%D:\SteamLibrary\steamapps\common\GTAV"
)

:: 5) last resort - scan every drive for GTA5.exe
if not defined GTADIR (
    echo   [!] Not found in the usual places.
    echo(
    set /p "DOSCAN=  Scan all drives for GTA5.exe? This can take a few minutes [Y/N]: "
    if /i "!DOSCAN!"=="Y" call :fullscan
)

:: 6) manual entry
if not defined GTADIR (
    echo(
    echo   [X] GTA V was not found automatically.
    echo       Paste the folder that contains GTA5.exe, or close this window.
    echo(
    set /p "GTADIR=  GTA V folder: "
    if defined GTADIR if not exist "!GTADIR!\GTA5.exe" set "GTADIR="
)

if not defined GTADIR (
    echo(
    echo   [X] Aborting - no valid GTA V folder found.
    echo(
    pause
    exit /b 1
)

echo(
echo   [OK] Found GTA V at:
echo        !GTADIR!
echo(

:: ---- write commandline.txt with -nobattleye ----
>"!GTADIR!\commandline.txt" echo -nobattleye
if exist "!GTADIR!\commandline.txt" (
    echo   [+] Created commandline.txt  ^(-nobattleye^)
) else (
    echo   [X] Could not write commandline.txt - try running as admin.
)

:: ---- delete BattlEye ----
if exist "!GTADIR!\BattlEye" (
    rmdir /s /q "!GTADIR!\BattlEye"
    if exist "!GTADIR!\BattlEye" ( echo   [X] Could not remove the BattlEye folder. ) else ( echo   [+] Removed the BattlEye folder. )
) else (
    echo   [i] No BattlEye folder found ^(already gone^).
)
if exist "!GTADIR!\BattlEye_x64.dll" (
    del /f /q "!GTADIR!\BattlEye_x64.dll"
    if exist "!GTADIR!\BattlEye_x64.dll" ( echo   [X] Could not remove BattlEye_x64.dll. ) else ( echo   [+] Removed BattlEye_x64.dll. )
)

echo(
echo   ==================================================
echo     Done!  BattlEye is disabled for GTA V.
echo     Launch the game normally to run your mods.
echo   ==================================================
echo(
echo   Tip: a game update can restore BattlEye - just run
echo        this file again if your mods stop loading.
echo(
pause
exit /b 0

:: ================= helpers =================
:chkreg
for /f "tokens=2,*" %%A in ('reg query %1 /v InstallFolder 2^>nul ^| find "InstallFolder"') do (
    if not defined GTADIR if exist "%%B\GTA5.exe" set "GTADIR=%%B"
)
goto :eof

:chkdir
if exist "%~1\GTA5.exe" set "GTADIR=%~1"
goto :eof

:fullscan
for %%D in (C D E F G H I J K L) do (
    if not defined GTADIR if exist "%%D:\" (
        echo   ... scanning %%D:\
        for /f "delims=" %%F in ('dir /s /b "%%D:\GTA5.exe" 2^>nul') do (
            if not defined GTADIR set "GTADIR=%%~dpF"
        )
    )
)
if defined GTADIR if "!GTADIR:~-1!"=="\" set "GTADIR=!GTADIR:~0,-1!"
goto :eof
