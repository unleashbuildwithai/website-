@echo off
echo ============================================
echo  Pushing wrangler.toml fix to GitHub...
echo ============================================
cd /d "c:\Users\Owner\Desktop\html"
git add wrangler.toml
git commit -m "fix: add [assets] directory for wrangler deploy - fixes white page"
git push origin main
echo.
echo ============================================
echo  Done! Check above for any errors.
echo  If you see "main -> main" it worked!
echo ============================================
pause
