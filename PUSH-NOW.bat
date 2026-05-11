@echo off
cd /d "c:\Users\Owner\Desktop\html"
echo.
echo === STEP 0: Syncing Dependencies ===
call npm install
echo.
echo === STEP 1: Git Status ===
git status
echo.
echo === STEP 2: Stage everything ===
git add -A
echo.
echo === STEP 3: Commit ===
set /p msg="Enter commit message (or press Enter for default): "
if "%msg%"=="" set msg="Update site configuration and dependencies"
git commit -m "%msg%"
echo.
echo === STEP 4: Push to GitHub ===
git push origin main
echo.
echo === STEP 5: Verify ===
git log --oneline -5
echo.
echo =========================================
echo  DONE! If push succeeded, Cloudflare will
echo  auto-redeploy in ~30-60 seconds.
echo  Check: https://geniusunleashed.pages.dev
echo =========================================
pause
