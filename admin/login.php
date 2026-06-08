<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/includes/layout.php';

start_admin_session();
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    $stmt = db()->prepare('SELECT * FROM admins WHERE username = :username AND status = :status LIMIT 1');
    $stmt->execute(['username' => $username, 'status' => 'active']);
    $admin = $stmt->fetch();

    if ($admin && password_verify($password, $admin['password_hash'])) {
        session_regenerate_id(true);
        $_SESSION['admin_id'] = (int) $admin['id'];
        $_SESSION['admin_role'] = $admin['role'];
        db()->prepare('UPDATE admins SET last_login_at = NOW() WHERE id = ?')->execute([(int) $admin['id']]);
        header('Location: /admin/index.php');
        exit;
    }

    $error = '帳號或密碼錯誤。';
}
?>
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>管理員登入 - 校園共享後台</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="<?= e(asset_url(__DIR__ . '/../styles/brand-tokens.css', '/styles/brand-tokens.css')) ?>" rel="stylesheet">
  <link href="<?= e(asset_url(__DIR__ . '/assets/admin-core.css', '/admin/assets/admin-core.css')) ?>" rel="stylesheet">
  <link href="<?= e(asset_url(__DIR__ . '/assets/admin-auth.css', '/admin/assets/admin-auth.css')) ?>" rel="stylesheet">
  <link href="<?= e(asset_url(__DIR__ . '/assets/admin-responsive.css', '/admin/assets/admin-responsive.css')) ?>" rel="stylesheet">
</head>
<body class="admin-body">
  <main class="admin-login">
    <div class="admin-login__shell">
      <section class="admin-login__hero" aria-labelledby="admin-login-title">
        <p class="admin-login__eyebrow">Campus Share Admin</p>
        <h1 id="admin-login-title" class="admin-login__title mt-3 mb-3">同一個校園共享品牌，給管理端更清楚的資料視角。</h1>
        <p class="admin-login__description mb-0">這裡保留前台的暖色校園紙感，但用更克制、更高密度的方式承接審查、會員管理與稽核任務。</p>
        <div class="admin-login__facts">
          <article class="admin-login__fact">
            <h2>會員管理</h2>
            <p>快速查找學生帳號、凍結原因與註冊狀態。</p>
          </article>
          <article class="admin-login__fact">
            <h2>物品審查</h2>
            <p>針對違規內容執行處置，保留操作紀錄。</p>
          </article>
          <article class="admin-login__fact">
            <h2>操作追蹤</h2>
            <p>集中檢視最近稽核行為與系統變更痕跡。</p>
          </article>
        </div>
      </section>
      <section class="admin-login__panel card" aria-labelledby="login-title">
        <div class="card-body">
          <p class="admin-kicker mb-2">管理入口</p>
          <h2 id="login-title" class="h3 fw-bold mb-3">管理員登入</h2>
          <p class="text-secondary mb-4">請使用具備管理權限的帳號登入後台。</p>
        <?php if ($error): ?>
          <div class="alert alert-danger" id="login-error" role="alert"><?= e($error) ?></div>
        <?php endif; ?>
        <form method="post" class="vstack gap-3">
          <?= csrf_field() ?>
          <div>
            <label for="username" class="form-label fw-semibold">帳號</label>
            <input id="username" name="username" class="form-control" required autocomplete="username" aria-describedby="<?= $error ? 'login-error' : '' ?>">
          </div>
          <div>
            <label for="password" class="form-label fw-semibold">密碼</label>
            <input id="password" name="password" type="password" class="form-control" required autocomplete="current-password">
          </div>
          <button class="btn admin-btn admin-btn--primary" type="submit">登入後台</button>
        </form>
      </div>
      </section>
    </div>
  </main>
</body>
</html>
