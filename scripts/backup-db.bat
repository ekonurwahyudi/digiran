@echo off
REM Database Backup Script for KKA DB
REM Usage: backup-db.bat [password]

set PGPASSWORD=%1
if "%PGPASSWORD%"=="" (
    echo Usage: backup-db.bat [your_postgres_password]
    echo Example: backup-db.bat mypassword123
    exit /b 1
)

set BACKUP_FILE=backup_kka_db_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%

echo Backing up database to %BACKUP_FILE%...
pg_dump -U postgres -h localhost -d kka_db > %BACKUP_FILE%

if %ERRORLEVEL% EQU 0 (
    echo Backup successful: %BACKUP_FILE%
) else (
    echo Backup failed!
)

set PGPASSWORD=
