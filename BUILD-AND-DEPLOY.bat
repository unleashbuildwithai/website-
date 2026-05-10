@echo off
echo ============================================
echo  BUILD + DEPLOY: Genius Unleashed
echo  Fixes: Desktop positioning + Mobile layout
echo ============================================
echo.

cd /d "c:\Users\Owner\Desktop\html\svelte-app"

echo [1/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 ( echo ERROR: npm install failed & pause & exit )

echo.
echo [2/5] Building Svelte app...
call npm run build
if %errorlevel% neq 0 ( echo ERROR: build failed & pause & exit )

echo.
echo [3/5] Copying built files to repo root...
cd /d "c:\Users\Owner\Desktop\html"
copy /Y "svelte-app\dist\index.html" "index.html"
if exist "svelte-app\dist\assets" (
  if not exist "assets" mkdir assets
  xcopy /E /Y /I "svelte-app\dist\assets\*" "assets\"
)
echo Copied index.html and assets/ to root.

echo.
echo [4/5] Staging and committing...
git add -A
git commit -m "Fix: Desktop section positioning + Mobile Reality/Fullstack side by side"

echo.
echo [5/5] Pushing to GitHub...
git push origin main

echo.
echo ============================================
echo  DONE! Site will auto-redeploy on Cloudflare
echo  Check: https://geniusunleashed.pages.dev
echo ============================================
pause
