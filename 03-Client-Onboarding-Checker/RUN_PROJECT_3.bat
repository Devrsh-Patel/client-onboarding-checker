@echo off
title Scalezix - Project 3: Client Onboarding Document Checker
echo ======================================================================
echo  SCALEZIX - PROJECT 3: CLIENT ONBOARDING DOCUMENT CHECKER
echo ======================================================================
echo.
echo Starting Django Backend Server on http://127.0.0.1:8001 ...
start "Scalezix Project 3 - Backend" cmd /k "cd /d "%~dp0backend" && python manage.py runserver 127.0.0.1:8001"

timeout /t 3 /nobreak > nul

echo Starting React Frontend on http://localhost:5174 ...
start "Scalezix Project 3 - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 2 /nobreak > nul

echo Opening browser at http://localhost:5174 ...
start http://localhost:5174

echo.
echo ======================================================================
echo  Both servers are running!
echo  Backend:  http://127.0.0.1:8001/api/
echo  Frontend: http://localhost:5174/
echo ======================================================================
pause

