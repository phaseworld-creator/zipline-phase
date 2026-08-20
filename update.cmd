@echo off
cls
echo ==========================================
echo    GitHub Auto-Updater Script
echo ==========================================
echo.

:: Check if a custom commit message was provided as an argument
if "%~1"=="" (
    set "commitMsg=Auto-update: %date% %time%"
) else (
    set "commitMsg=%~1"
)

echo [1/4] Adding all modified and new files...
git add .
if errorlevel 1 goto error

echo [2/4] Committing with message: "%commitMsg%"
git commit -m "%commitMsg%"
if errorlevel 1 goto error

echo [3/4] Pulling latest changes from remote (rebase)...
git pull --rebase
if errorlevel 1 goto error

echo [4/4] Pushing to GitHub...
git push
if errorlevel 1 goto error

echo.
echo ==========================================
echo    Successfully updated GitHub repo!
echo ==========================================
goto end

:error
echo.
echo [ERROR] Something went wrong during the Git process.
echo Please check the error messages above.

:end
echo.
pause