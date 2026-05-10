@echo off
cd /d "c:\Users\Owner\Desktop\html"
echo ============================================
echo  GIT STATUS
echo ============================================
git status
echo.
echo ============================================
echo  RECENT COMMITS
echo ============================================
git log --oneline -8
echo.
echo ============================================
echo  STAGING ALL CHANGES
echo ============================================
git add -A
echo.
echo ============================================
echo  COMMITTING
echo ============================================
git commit -m "Fix: Cloudflare Pages config - assets at root, correct deploy script"
echo.
echo ============================================
echo  PUSHING TO GITHUB (main)
echo ============================================
git push origin main
echo.
echo ============================================
echo  VERIFY - REMOTE STATUS
echo ============================================
git log --oneline -5
echo.
echo ============================================
echo  DONE - Check Cloudflare dashboard for auto-redeploy
echo ============================================
pause
