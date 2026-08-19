@echo off
title Mevsim Gecisi - Interaktif Hikaye
cd /d "%~dp0"
start "" http://localhost:5173
call npm run dev
pause
