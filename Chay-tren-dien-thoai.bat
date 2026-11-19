@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Dang mo may chu cho dien thoai...
node tools/serve.mjs 8080 --lan
pause
