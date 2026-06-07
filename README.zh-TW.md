# Campus Share Starter

[English](README.md) | 繁體中文

Campus Share Starter 是一個智慧校園二手交流系統的起始專案，採用前後台分離、共用資料庫的結構：

- 前端：Next.js App Router + Tailwind CSS
- 後台管理：PHP + Apache + Bootstrap + Chart.js
- 資料庫：前端與後台共用的 MariaDB / MySQL schema
- 驗證相關：Next.js 學生登入 session 路由，以及 PHP 後台登入流程

## 專案結構

- `app/`：Next.js 路由、頁面與 API handlers
- `components/`：共用前端元件
- `lib/`：前端資料處理與驗證工具
- `admin/`：PHP 後台管理介面
- `database/`：資料表 schema 與 seed SQL
- `docker/`：Dockerfile 與 Apache 設定
- `docs/`：驗收與驗證文件

## 環境變數檔案

請依執行環境選擇對應的範本：

- `.env.example`：本機或 XAMPP 環境
- `.env.docker.example`：Docker 環境

專案主要使用的變數如下：

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

## Docker 快速啟動

這個 repo 已經提供三個服務的 Docker stack：

- `frontend`：Next.js 開發伺服器，位於 `http://localhost:3000`
- `admin`：PHP/Apache 後台，位於 `http://localhost:8080/admin/login.php`
- `db`：MariaDB，對外開放在 host port `3307`

建議啟動方式：

```bash
cp .env.docker.example .env
docker compose up --build
```

補充說明：

- `admin` 容器在找不到 `vendor/autoload.php` 時，會自動執行 `composer install`
- `db` 第一次啟動時會自動匯入 `database/schema.sql` 與 `database/seed.sql`
- Windows 上需要先啟動 Docker Desktop 或其他 Docker daemon
- Docker 使用的 port 有刻意避開常見的 XAMPP 預設值

停止服務：

```bash
docker compose down
```

如果需要連資料庫資料一起重建：

```bash
docker compose down -v
docker compose up --build
```

## 後台預設登入資訊

`database/seed.sql` 目前提供一組可登入的預設管理員：

- 帳號：`admin`
- 密碼：`admin1234`

注意：

- 這組帳密是給開發、展示與驗收環境使用，不適合直接拿去正式上線
- 如果你的 `db_data` volume 已經存在，單純修改 `seed.sql` 不會自動套用到既有資料庫
- 若要重新吃到 seed，請執行 `docker compose down -v` 後再重新 `up --build`
- `seed.sql` 已不再預塞任何學生帳號；前台學生登入必須使用實際註冊過的帳號

## 前端本機指令

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

如果 PowerShell 擋下 `npm.ps1`，改用：

```powershell
cmd /c npm run typecheck
cmd /c npm run build
```

## PHP / 後台相關指令

只有在你不打算使用 Docker 的 admin 容器時，才需要在 host 上安裝 PHP 相依：

```bash
composer install
```

檢查 PHP 語法：

```powershell
Get-ChildItem -Path admin -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }
```

如果 `php` 不在 `PATH` 中，可以直接使用 XAMPP 的 PHP，例如：

```powershell
C:\xampp\php\php.exe -l admin\includes\config.php
```

## 不使用 Docker 的資料庫匯入

若資料庫不是透過 Docker 啟動，請手動匯入 SQL：

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

注意：

- PHP 後台會透過 `admin/includes/config.php` 從 `.env` 讀取資料庫設定
- 若你不想使用預設後台密碼，請在匯入前先把 `database/seed.sql` 裡的管理員 hash 換掉

## XAMPP 交付流程

這個專案最終交付流程是以 XAMPP 為主：

1. 將 `.env.example` 複製成 `.env`，並改成 XAMPP 的資料庫設定
2. 匯入 `database/schema.sql` 與 `database/seed.sql`
3. 打包前確認 `vendor/` 已存在
4. 實際驗證前端與後台流程

參考文件：

- [Docker / XAMPP 驗證流程](docs/docker-xampp-verification.md)
- [驗收清單](docs/acceptance-checklist.md)

## 驗證清單

交付前建議至少執行以下檢查：

```bash
npm run typecheck
npm run build
```

```powershell
Get-ChildItem -Path admin -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }
```

接著依序完成：

- [docs/acceptance-checklist.md](docs/acceptance-checklist.md)
- [docs/docker-xampp-verification.md](docs/docker-xampp-verification.md)
