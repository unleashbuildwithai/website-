@echo off
echo ============================================
echo  Setting up GitHub Pages Redirect
echo  Old: https://unleashbuildwithai.github.io/website-/
echo  New: https://geniusunleashed.pages.dev
echo ============================================
echo.

:: Create a temp folder for the gh-pages redirect
set TMPDIR=%TEMP%\ghpages-redirect-%RANDOM%
mkdir "%TMPDIR%"
cd /d "%TMPDIR%"

:: Write the redirect index.html
echo ^<!DOCTYPE html^> > index.html
echo ^<html lang="en"^> >> index.html
echo ^<head^> >> index.html
echo   ^<meta charset="UTF-8" /^> >> index.html
echo   ^<meta http-equiv="refresh" content="0; url=https://geniusunleashed.pages.dev" /^> >> index.html
echo   ^<link rel="canonical" href="https://geniusunleashed.pages.dev" /^> >> index.html
echo   ^<title^>Redirecting to Genius Unleashed...^</title^> >> index.html
echo   ^<script^>window.location.replace("https://geniusunleashed.pages.dev");^</script^> >> index.html
echo ^</head^> >> index.html
echo ^<body^>^<p^>Redirecting... ^<a href="https://geniusunleashed.pages.dev"^>Click here^</a^>^</p^>^</body^> >> index.html
echo ^</html^> >> index.html

echo Created redirect index.html
echo.

:: Initialize git
git init
git checkout -b gh-pages
git config user.email "deploy@geniusunleashed.pages.dev"
git config user.name "Genius Unleashed Deploy"

:: Add remote
git remote add origin https://github.com/unleashbuildwithai/website-.git

echo.
echo Adding and committing...
git add index.html
git commit -m "Redirect: GitHub Pages to geniusunleashed.pages.dev"

echo.
echo Pushing to gh-pages branch...
git push origin gh-pages --force

echo.
echo ============================================
echo  DONE!
echo  Check GitHub: go to your repo Settings
echo  Pages section to verify gh-pages is active
echo  Then test: https://unleashbuildwithai.github.io/website-/
echo ============================================
echo.
:: Cleanup
cd /d "c:\Users\Owner\Desktop\html"
rmdir /s /q "%TMPDIR%"
pause
