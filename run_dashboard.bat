@echo off
title CyberSOC Dashboard

cd /d C:\Users\vboxuser\Desktop\End Project

:: Start Flask instantly
start "" cmd /k python app.py

:: Open browser immediately
start http://127.0.0.1:5000

exit