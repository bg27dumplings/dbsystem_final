# Docker and XAMPP Verification Workflow

## Purpose

Use Docker for local development and dependency setup, then use XAMPP for the final handoff check.

## Local Docker Workflow

1. Copy `.env.docker.example` to `.env` if you want the repo-level environment file to match Docker defaults.
2. Start the stack:
   - `docker compose up --build`
3. Open:
   - Frontend: `http://localhost:3000`
   - Admin: `http://localhost:8080/admin/login.php`
4. Docker behavior:
   - `frontend` runs the Next.js dev server.
   - `admin` installs Composer dependencies automatically when `vendor/autoload.php` is missing.
   - `db` initializes from `database/schema.sql` and `database/seed.sql` on first startup.
5. If you need a clean database re-import, remove the Docker volume first:
   - `docker compose down -v`
6. On Windows, make sure Docker Desktop or another Docker daemon is running before you start the stack.

## Static Verification

Run these before handoff:

```powershell
npm run typecheck
npm run build
Get-ChildItem -Path admin -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }
```

If PowerShell blocks `npm.ps1`, run:

```powershell
cmd /c npm run typecheck
cmd /c npm run build
```

If `php` is not on `PATH`, run the lint command with the XAMPP PHP executable after XAMPP is installed.

## XAMPP Handoff Verification

1. Place the project in the XAMPP web root.
2. Ensure `.env` points to the XAMPP database settings, especially:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASS`
3. Import `database/schema.sql` and `database/seed.sql`.
4. Confirm `vendor/` exists in the project before zipping the handoff package.
5. Verify:
   - Admin login loads.
   - Member freeze and unfreeze actions work.
   - Item violation removal works.
   - Sensitive actions create `admin_logs` entries.

## Acceptance Checks

Follow `docs/acceptance-checklist.md` and explicitly re-check:

- Admin tables on mobile widths.
- Chart.js cards staying inside their containers.
- Keyboard access for forms, filters, chat, and appointment actions.
