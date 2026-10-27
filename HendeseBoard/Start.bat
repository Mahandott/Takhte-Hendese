@echo off
rem Takhte Hendese - portable launcher for Windows 7
setlocal
set "PAGE=%~dp0index.html"
set "URL=file:///%PAGE:\=/%"

set "CH1=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "CH2=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
set "CH3=%LocalAppData%\Google\Chrome\Application\chrome.exe"
set "ED1=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "ED2=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
set "FF1=%ProgramFiles%\Mozilla Firefox\firefox.exe"
set "FF2=%ProgramFiles(x86)%\Mozilla Firefox\firefox.exe"

if exist "%CH1%" (
  start "" "%CH1%" --kiosk --new-window "%URL%"
  goto :eof
)
if exist "%CH2%" (
  start "" "%CH2%" --kiosk --new-window "%URL%"
  goto :eof
)
if exist "%CH3%" (
  start "" "%CH3%" --kiosk --new-window "%URL%"
  goto :eof
)
if exist "%ED1%" (
  start "" "%ED1%" --kiosk --new-window "%URL%"
  goto :eof
)
if exist "%ED2%" (
  start "" "%ED2%" --kiosk --new-window "%URL%"
  goto :eof
)
if exist "%FF1%" (
  start "" "%FF1%" -kiosk "%PAGE%"
  goto :eof
)
if exist "%FF2%" (
  start "" "%FF2%" -kiosk "%PAGE%"
  goto :eof
)
start "" "%PAGE%"
