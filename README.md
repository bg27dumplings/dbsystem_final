# Campus Share Starter

English | [繁體中文](README.zh-TW.md)

Campus Share Starter is a smart-campus second-hand sharing system with a split stack:

- Frontend: Next.js App Router + Tailwind CSS
- Admin panel: PHP + Apache + Bootstrap + Chart.js
- Database: MariaDB / MySQL schema shared by frontend and admin
- Authentication: Next.js student session routes and PHP admin login flow

## Repository Layout

- `app/`: Next.js routes, pages, and API handlers
- `components/`: shared frontend components
- `lib/`: frontend data helpers and authentication utilities
- `admin/`: PHP admin dashboard
- `database/`: schema and seed SQL files
- `docker/`: Dockerfiles and Apache config
- `docs/`: acceptance and verification documents

## Environment Files

Choose the template that matches your runtime:

- `.env.example`: local host or XAMPP setup
- `.env.docker.example`: Docker setup

Core variables used in this project:

- `NEXT_PUBLIC_APP_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASS`
- `ADMIN_SESSION_NAME`
- `UPLOAD_DIR`
- `UPLOAD_PUBLIC_PATH`
- `CAPTCHA_SESSION_KEY`
- `STUDENT_SESSION_SECRET`

## Docker Quick Start

This repository provides a three-service Docker stack:

- `frontend`: Next.js dev server at `http://localhost:3000`
- `admin`: PHP/Apache admin panel at `http://localhost:8080/admin/login.php`
- `db`: MariaDB exposed on host port `3307`

Recommended startup:

```bash
cp .env.docker.example .env
docker compose up --build
```

Notes:

- `admin` runs `composer install` automatically when `vendor/autoload.php` is missing.
- `db` imports `database/schema.sql` and `database/seed.sql` on first startup.
- Docker Desktop or another Docker daemon must already be running on Windows.
- The Docker ports intentionally avoid common XAMPP defaults.

Stop the stack:

```bash
docker compose down
```

If you need to rebuild including database data:

```bash
docker compose down -v
docker compose up --build
```

## Default Admin Login

`database/seed.sql` currently provides one working default admin account:

- Username: `admin`
- Password: `admin1234`

Notes:

- This credential is intended for development, demo, and review environments, not production.
- If your `db_data` volume already exists, changing `seed.sql` will not automatically update the existing database.
- To reapply the seed, run `docker compose down -v` and start the stack again.
- `seed.sql` no longer inserts any default student accounts. Frontend student login now requires real registered accounts.

## Local Frontend Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

If PowerShell blocks `npm.ps1`, use:

```powershell
cmd /c npm run typecheck
cmd /c npm run build
```

## PHP / Admin Commands

Install PHP dependencies on the host only if you are not using the Docker admin container:

```bash
composer install
```

Lint PHP files:

```powershell
Get-ChildItem -Path admin -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }
```

If `php` is not on `PATH`, use the XAMPP PHP binary, for example:

```powershell
C:\xampp\php\php.exe -l admin\includes\config.php
```

## Database Import Without Docker

If the database is not started through Docker, import the SQL manually:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

Notes:

- The PHP admin reads database settings from `.env` through `admin/includes/config.php`.
- If you do not want to keep the default admin password, replace the admin password hash in `database/seed.sql` before importing.

## XAMPP Handoff

This project is ultimately handed off in an XAMPP-oriented flow:

1. Copy `.env.example` to `.env` and point it to the XAMPP database settings.
2. Import `database/schema.sql` and `database/seed.sql`.
3. Make sure `vendor/` exists before creating the final zip package.
4. Verify the frontend and admin flows.

Reference documents:

- [Docker / XAMPP verification flow](docs/docker-xampp-verification.md)
- [Acceptance checklist](docs/acceptance-checklist.md)

## Verification Checklist

Run these checks before handoff:

```bash
npm run typecheck
npm run build
```

```powershell
Get-ChildItem -Path admin -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }
```

Then complete:

- [docs/acceptance-checklist.md](docs/acceptance-checklist.md)
- [docs/docker-xampp-verification.md](docs/docker-xampp-verification.md)
