<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/security.php';

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
  <link href="/admin/assets/admin.css" rel="stylesheet">
</head>
<body class="bg-light">
  <main class="container py-5">
    <section class="mx-auto card shadow-sm" style="max-width: 28rem;" aria-labelledby="login-title">
      <div class="card-body p-4">
        <h1 id="login-title" class="h3 fw-bold">管理員登入</h1>
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
          <button class="btn btn-dark fw-bold" type="submit">登入後台</button>
        </form>
      </div>
    </section>
  </main>
</body>
</html>
