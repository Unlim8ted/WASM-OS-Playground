@echo off
setlocal EnableExtensions DisableDelayedExpansion
title WASM OS Playground - Byte-Preserving Batched Initial Push

REM ============================================================
REM WASM OS Playground - Batched Initial Push
REM ============================================================
REM
REM Repository:
REM   https://github.com/Unlim8ted/WASM-OS-Playground
REM
REM Branch:
REM   main
REM
REM This script:
REM
REM   - PRESERVES working/project files
REM   - DOES NOT normalize LF/CRLF line endings
REM   - DOES NOT modify file contents
REM   - Resets LOCAL Git history
REM   - Creates fresh main branch
REM   - Adds files in <= 900 MiB batches
REM   - Commits each batch
REM   - Pushes each batch immediately
REM
REM Sequence:
REM
REM   files -> batch 1 -> commit -> push main
REM   more  -> batch 2 -> commit -> push main
REM   more  -> batch 3 -> commit -> push main
REM   ...
REM
REM This script DOES NOT run:
REM
REM   git reset --hard
REM   git clean
REM   git restore
REM   git checkout -- .
REM
REM ============================================================


REM ============================================================
REM CONFIGURATION
REM ============================================================

set "MAX_MIB=900"
set "REMOTE=origin"
set "BRANCH=main"
set "REMOTE_URL=https://github.com/Unlim8ted/WASM-OS-Playground.git"

set "GIT="

set "MANIFEST=%TEMP%\wasm_git_manifest_%RANDOM%_%RANDOM%.txt"
set "SIZEFILE=%TEMP%\wasm_git_size_%RANDOM%_%RANDOM%.txt"
set "ATTRFILE=%TEMP%\wasm_git_attributes_%RANDOM%_%RANDOM%.txt"

set /a BATCH=1
set /a FILE_COUNT=0
set /a BATCH_MIB=0
set /a TOTAL_FILES=0


echo.
echo ========================================
echo   Git Batched Initial Push
echo ========================================
echo.


REM ============================================================
REM FIND GIT
REM ============================================================

echo Looking for Git...

where git >nul 2>&1

if not errorlevel 1 (
    for /f "delims=" %%G in ('where git') do (
        if not defined GIT set "GIT=%%G"
    )
)


REM GitHub Desktop bundled Git fallback

if not defined GIT (
    echo Git is not on PATH.
    echo Looking for GitHub Desktop Git...
    echo.

    for /f "delims=" %%G in ('dir /b /s "%LOCALAPPDATA%\GitHubDesktop\app-*\resources\app\git\cmd\git.exe" 2^>nul') do (
        set "GIT=%%G"
    )
)


REM Standard Git for Windows fallback

if not defined GIT (
    if exist "%ProgramFiles%\Git\cmd\git.exe" (
        set "GIT=%ProgramFiles%\Git\cmd\git.exe"
    )
)

if not defined GIT (
    if exist "%ProgramFiles%\Git\bin\git.exe" (
        set "GIT=%ProgramFiles%\Git\bin\git.exe"
    )
)


REM Verify Git

if not defined GIT (
    echo.
    echo ERROR: Could not find Git.
    goto :ERROR
)

echo Found Git:
echo   "%GIT%"
echo.

"%GIT%" --version

if errorlevel 1 (
    echo.
    echo ERROR: Git could not be executed.
    goto :ERROR
)


REM ============================================================
REM SHOW TARGET
REM ============================================================

echo.
echo Current folder:
echo   %CD%
echo.

echo Destination:
echo   %REMOTE_URL%
echo.

echo Branch:
echo   main
echo.


REM ============================================================
REM INITIALIZE REPOSITORY IF NEEDED
REM ============================================================

if not exist ".git" (
    echo Initializing Git repository...
    echo.

    "%GIT%" init

    if errorlevel 1 (
        echo.
        echo ERROR: git init failed.
        goto :ERROR
    )
)


REM ============================================================
REM DISABLE LINE ENDING CONVERSION
REM ============================================================
REM
REM This is done BEFORE git add.
REM
REM core.autocrlf=false
REM     Do not automatically convert LF <-> CRLF.
REM
REM core.safecrlf=false
REM     Do not interfere with byte-preserving behavior.
REM ============================================================

echo ========================================
echo   Configuring byte preservation
echo ========================================
echo.

"%GIT%" config core.autocrlf false

if errorlevel 1 (
    echo ERROR: Could not disable core.autocrlf.
    goto :ERROR
)

"%GIT%" config core.safecrlf false

if errorlevel 1 (
    echo ERROR: Could not configure core.safecrlf.
    goto :ERROR
)


REM ============================================================
REM CREATE TEMPORARY ATTRIBUTE POLICY
REM ============================================================
REM
REM "* -text"
REM
REM tells Git to treat everything as non-text for purposes of
REM Git's text normalization.
REM
REM IMPORTANT:
REM
REM We DO NOT create or modify your project's .gitattributes.
REM
REM Instead, we use Git's repository-local info/attributes file.
REM This lives inside .git and therefore does not modify your
REM project files.
REM ============================================================

set "GIT_INFO_DIR=.git\info"

if not exist "%GIT_INFO_DIR%" (
    mkdir "%GIT_INFO_DIR%"

    if errorlevel 1 (
        echo.
        echo ERROR: Could not create .git\info.
        goto :ERROR
    )
)


REM Back up existing repository-local attributes if they exist.

if exist ".git\info\attributes" (
    copy /y ".git\info\attributes" "%ATTRFILE%" >nul

    if errorlevel 1 (
        echo.
        echo ERROR: Could not back up .git\info\attributes.
        goto :ERROR
    )
)


REM Force all files to bypass text normalization.

> ".git\info\attributes" echo * -text


echo Git line-ending conversion disabled.
echo Git text normalization disabled.
echo.
echo Files will be staged without LF/CRLF conversion.
echo.


REM ============================================================
REM CONFIGURE REMOTE
REM ============================================================

echo ========================================
echo   Configuring GitHub remote
echo ========================================
echo.

"%GIT%" remote get-url "%REMOTE%" >nul 2>&1

if errorlevel 1 (

    echo Adding origin:
    echo   %REMOTE_URL%
    echo.

    "%GIT%" remote add "%REMOTE%" "%REMOTE_URL%"

    if errorlevel 1 (
        echo.
        echo ERROR: Could not add origin.
        goto :ERROR
    )

) else (

    echo Origin already exists.
    echo Setting it to:
    echo   %REMOTE_URL%
    echo.

    "%GIT%" remote set-url "%REMOTE%" "%REMOTE_URL%"

    if errorlevel 1 (
        echo.
        echo ERROR: Could not update origin.
        goto :ERROR
    )
)


echo.
echo Remote:
"%GIT%" remote -v
echo.


REM ============================================================
REM CONFIRM
REM ============================================================

echo ========================================
echo   IMPORTANT
echo ========================================
echo.
echo This script WILL:
echo.
echo   - Preserve project files
echo   - Preserve folders
echo   - Preserve original LF/CRLF bytes
echo   - Reset LOCAL Git commit history
echo   - Create fresh main
echo   - Add files in <= %MAX_MIB% MiB batches
echo   - Commit each batch
echo   - Push each batch immediately
echo.
echo It WILL NOT:
echo.
echo   - reset --hard
echo   - clean your directory
echo   - restore files
echo   - overwrite project files
echo   - convert LF to CRLF
echo   - convert CRLF to LF
echo.
echo Destination:
echo.
echo   %REMOTE_URL%
echo.
echo Branch:
echo.
echo   main
echo.

choice /C YN /N /M "Continue? [Y/N]: "

if errorlevel 2 (
    echo.
    echo Cancelled.
    goto :RESTORE_AND_END
)

echo.


REM ============================================================
REM CREATE FRESH HISTORY
REM ============================================================

echo ========================================
echo   Creating fresh Git history
echo ========================================
echo.


REM Find current branch

set "CURRENT_BRANCH="

for /f "delims=" %%B in ('"%GIT%" branch --show-current 2^>nul') do (
    set "CURRENT_BRANCH=%%B"
)


REM If previous failed run left us on temp branch, rename it.

if /I "%CURRENT_BRANCH%"=="__batched_initial_push__" (
    "%GIT%" branch -m "__old_batched_initial_push__"

    if errorlevel 1 (
        echo.
        echo ERROR: Could not rename leftover branch.
        goto :ERROR
    )
)


REM Delete stale temp branch pointers.
REM This does NOT delete working files.

"%GIT%" branch -D "__batched_initial_push__" >nul 2>&1
"%GIT%" branch -D "__old_batched_initial_push__" >nul 2>&1


REM ============================================================
REM CREATE ORPHAN BRANCH
REM ============================================================

"%GIT%" checkout --orphan "__batched_initial_push__"

if errorlevel 1 (
    echo.
    echo ERROR: Could not create orphan branch.
    goto :ERROR
)


REM ============================================================
REM CLEAR GIT INDEX ONLY
REM ============================================================
REM
REM This clears files previously staged by the earlier BAT.
REM
REM It DOES NOT remove files from O:\OS.
REM ============================================================

"%GIT%" rm -r --cached --ignore-unmatch . >nul 2>&1

"%GIT%" read-tree --empty

if errorlevel 1 (
    echo.
    echo ERROR: Could not clear Git index.
    goto :ERROR
)

echo Git index cleared.
echo Working files untouched.
echo.


REM ============================================================
REM REMOVE OLD LOCAL MAIN POINTER
REM ============================================================

"%GIT%" branch -D "main" >nul 2>&1


REM ============================================================
REM RENAME NEW BRANCH TO MAIN
REM ============================================================

"%GIT%" branch -m "main"

if errorlevel 1 (
    echo.
    echo ERROR: Could not create fresh main branch.
    goto :ERROR
)


REM ============================================================
REM VERIFY MAIN
REM ============================================================

set "CURRENT_BRANCH="

for /f "delims=" %%B in ('"%GIT%" branch --show-current') do (
    set "CURRENT_BRANCH=%%B"
)

if /I not "%CURRENT_BRANCH%"=="main" (
    echo.
    echo ========================================
    echo   BRANCH ERROR
    echo ========================================
    echo.
    echo Expected:
    echo   main
    echo.
    echo Actual:
    echo   %CURRENT_BRANCH%
    echo.
    goto :ERROR
)


echo Fresh branch:
echo   main
echo.
echo Confirmed: operating on MAIN.
echo.


REM ============================================================
REM BUILD FILE MANIFEST
REM ============================================================
REM
REM Use Windows default encoding.
REM
REM This prevents the UTF-8 BOM from becoming:
REM
REM     ∩╗┐filename
REM
REM in CMD.
REM ============================================================

echo ========================================
echo   Building file list
echo ========================================
echo.

if exist "%MANIFEST%" (
    del /q "%MANIFEST%" >nul 2>&1
)

set "MANIFEST_FOR_GIT_BATCH=%MANIFEST%"


powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$root=(Get-Location).Path; $gitDir=[IO.Path]::Combine($root,'.git'); Get-ChildItem -LiteralPath $root -File -Recurse -Force | Where-Object { -not $_.FullName.StartsWith($gitDir + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase) } | ForEach-Object { $_.FullName.Substring($root.Length + 1) } | Out-File -LiteralPath $env:MANIFEST_FOR_GIT_BATCH -Encoding Default"

if errorlevel 1 (
    echo.
    echo ERROR: PowerShell could not scan repository.
    goto :ERROR
)

if not exist "%MANIFEST%" (
    echo.
    echo ERROR: File manifest was not created.
    goto :ERROR
)


echo File list created successfully.
echo.


REM ============================================================
REM RESET COUNTERS
REM ============================================================

set /a BATCH=1
set /a FILE_COUNT=0
set /a BATCH_MIB=0
set /a TOTAL_FILES=0


REM ============================================================
REM PROCESS FILES
REM ============================================================

echo ========================================
echo   Adding files
echo ========================================
echo.
echo Maximum batch:
echo   %MAX_MIB% MiB
echo.
echo Line-ending conversion:
echo   DISABLED
echo.


for /f "usebackq delims=" %%F in ("%MANIFEST%") do (

    call :PROCESS_FILE "%%F"

    if errorlevel 1 (
        goto :ERROR
    )
)


REM ============================================================
REM FINAL BATCH
REM ============================================================

if %FILE_COUNT% GTR 0 (

    call :COMMIT_AND_PUSH

    if errorlevel 1 (
        goto :ERROR
    )
)


REM ============================================================
REM VERIFY SOMETHING WAS PROCESSED
REM ============================================================

if %TOTAL_FILES% EQU 0 (
    echo.
    echo ERROR: No non-ignored files were found.
    goto :ERROR
)


REM ============================================================
REM SUCCESS
REM ============================================================

echo.
echo ========================================
echo   COMPLETE
echo ========================================
echo.
echo All files processed.
echo.
echo Total files:
echo   %TOTAL_FILES%
echo.
echo Branch:
echo   main
echo.
echo Repository:
echo   %REMOTE_URL%
echo.
echo Each batch was:
echo.
echo   ADD
echo   COMMIT
echo   PUSH
echo   NEXT BATCH
echo.
echo Working files were NOT reset,
echo restored, cleaned, or overwritten.
echo.

goto :RESTORE_AND_END



REM ============================================================
REM PROCESS ONE FILE
REM ============================================================

:PROCESS_FILE

set "CURRENT_FILE=%~1"

if not defined CURRENT_FILE (
    exit /b 0
)


REM ============================================================
REM CHECK .gitignore
REM ============================================================

"%GIT%" check-ignore -q -- "%CURRENT_FILE%"

if not errorlevel 1 (
    exit /b 0
)


REM ============================================================
REM GET FILE SIZE
REM ============================================================

set "GIT_BATCH_CURRENT_FILE=%CURRENT_FILE%"
set "GIT_BATCH_SIZE_FILE=%SIZEFILE%"

if exist "%SIZEFILE%" (
    del /q "%SIZEFILE%" >nul 2>&1
)


powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$p=Join-Path (Get-Location).Path $env:GIT_BATCH_CURRENT_FILE; if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { Write-Error ('File not found: ' + $p); exit 1 }; $s=(Get-Item -LiteralPath $p).Length; [int64][math]::Ceiling($s / 1MB) | Out-File -LiteralPath $env:GIT_BATCH_SIZE_FILE -Encoding ASCII"

if errorlevel 1 (
    echo.
    echo ERROR: Could not determine size:
    echo   %CURRENT_FILE%
    echo.
    exit /b 1
)

if not exist "%SIZEFILE%" (
    echo.
    echo ERROR: Size result missing:
    echo   %CURRENT_FILE%
    echo.
    exit /b 1
)


set "FILE_MIB="
set /p FILE_MIB=<"%SIZEFILE%"


if not defined FILE_MIB (
    echo.
    echo ERROR: Invalid file size:
    echo   %CURRENT_FILE%
    echo.
    exit /b 1
)


REM ============================================================
REM SINGLE FILE LIMIT
REM ============================================================

if %FILE_MIB% GTR %MAX_MIB% (
    echo.
    echo ========================================
    echo   FILE TOO LARGE
    echo ========================================
    echo.
    echo File:
    echo   %CURRENT_FILE%
    echo.
    echo Size:
    echo   %FILE_MIB% MiB
    echo.
    echo This exceeds the %MAX_MIB% MiB batch target.
    echo.
    exit /b 1
)


REM ============================================================
REM CHECK WHETHER FILE FITS CURRENT BATCH
REM ============================================================

set /a NEW_SIZE=%BATCH_MIB%+%FILE_MIB%


if %FILE_COUNT% GTR 0 (
    if %NEW_SIZE% GTR %MAX_MIB% (

        call :COMMIT_AND_PUSH

        if errorlevel 1 (
            exit /b 1
        )
    )
)


REM ============================================================
REM ADD FILE
REM ============================================================

echo [Batch %BATCH%] Adding: %CURRENT_FILE%

"%GIT%" add -- "%CURRENT_FILE%"

if errorlevel 1 (
    echo.
    echo ERROR: Could not add:
    echo   %CURRENT_FILE%
    echo.
    exit /b 1
)


REM Update counters

set /a BATCH_MIB+=FILE_MIB
set /a FILE_COUNT+=1
set /a TOTAL_FILES+=1

exit /b 0



REM ============================================================
REM COMMIT AND PUSH
REM ============================================================

:COMMIT_AND_PUSH

echo.
echo ========================================
echo   BATCH %BATCH%
echo ========================================
echo.
echo Approximate raw size:
echo   %BATCH_MIB% MiB
echo.
echo Files:
echo   %FILE_COUNT%
echo.


REM ============================================================
REM VERIFY STAGED CHANGES
REM ============================================================

"%GIT%" diff --cached --quiet

if not errorlevel 1 (
    echo.
    echo ERROR: No staged changes in batch.
    echo.
    exit /b 1
)


REM ============================================================
REM COMMIT
REM ============================================================

echo Committing batch %BATCH%...
echo.

"%GIT%" commit -m "Initial import batch %BATCH%"

if errorlevel 1 (
    echo.
    echo ========================================
    echo   COMMIT FAILED
    echo ========================================
    echo.
    exit /b 1
)


REM ============================================================
REM VERIFY MAIN BEFORE PUSH
REM ============================================================

set "CURRENT_BRANCH="

for /f "delims=" %%B in ('"%GIT%" branch --show-current') do (
    set "CURRENT_BRANCH=%%B"
)


if /I not "%CURRENT_BRANCH%"=="main" (
    echo.
    echo ========================================
    echo   BRANCH ERROR
    echo ========================================
    echo.
    echo REFUSING TO PUSH.
    echo.
    echo Expected:
    echo   main
    echo.
    echo Actual:
    echo   %CURRENT_BRANCH%
    echo.
    exit /b 1
)


REM ============================================================
REM PUSH THIS COMMIT NOW
REM ============================================================

echo.
echo Pushing batch %BATCH% to origin/main...
echo.


"%GIT%" push --force -u "%REMOTE%" "main"

if errorlevel 1 (
    echo.
    echo ========================================
    echo   PUSH FAILED
    echo ========================================
    echo.
    echo Batch %BATCH% is committed locally,
    echo but GitHub rejected or failed the push.
    echo.
    echo Working files remain untouched.
    echo.
    exit /b 1
)


echo.
echo ========================================
echo   Batch %BATCH% pushed successfully
echo ========================================
echo.


REM ============================================================
REM NEXT BATCH
REM ============================================================

set /a BATCH+=1
set /a BATCH_MIB=0
set /a FILE_COUNT=0

exit /b 0



REM ============================================================
REM RESTORE LOCAL INFO/ATTRIBUTES
REM ============================================================

:RESTORE_ATTRIBUTES

REM If there was an existing .git\info\attributes,
REM restore it.

if exist "%ATTRFILE%" (

    copy /y "%ATTRFILE%" ".git\info\attributes" >nul 2>&1

    del /q "%ATTRFILE%" >nul 2>&1

) else (

    REM There wasn't one before this script.
    REM Remove the temporary one we created.

    if exist ".git\info\attributes" (
        del /q ".git\info\attributes" >nul 2>&1
    )
)

exit /b 0



REM ============================================================
REM CLEAN TEMP FILES
REM ============================================================

:CLEAN_TEMP

if exist "%MANIFEST%" (
    del /q "%MANIFEST%" >nul 2>&1
)

if exist "%SIZEFILE%" (
    del /q "%SIZEFILE%" >nul 2>&1
)

exit /b 0



REM ============================================================
REM ERROR HANDLER
REM ============================================================

:ERROR

call :RESTORE_ATTRIBUTES
call :CLEAN_TEMP

echo.
echo ========================================
echo   SCRIPT STOPPED
echo ========================================
echo.
echo Read the error above.
echo.
echo IMPORTANT:
echo.
echo Your working project files have NOT
echo intentionally been reset, restored,
echo cleaned, deleted, or overwritten.
echo.

pause
exit /b 1



REM ============================================================
REM NORMAL END
REM ============================================================

:RESTORE_AND_END

call :RESTORE_ATTRIBUTES
call :CLEAN_TEMP

echo.
pause
exit /b 0