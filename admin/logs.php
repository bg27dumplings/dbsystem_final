<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/includes/layout.php';

require_admin();

$logs = db()->query(
    'SELECT l.*, a.username
     FROM admin_logs l
     JOIN admins a ON a.id = l.admin_id
     ORDER BY l.created_at DESC
     LIMIT 100'
)->fetchAll();

admin_header('操作紀錄');
?>
<div class="mb-4">
  <p class="text-success fw-bold mb-1">Audit log</p>
  <h1 class="h2 fw-bold">管理員操作紀錄</h1>
</div>
<div class="table-responsive">
  <table class="table align-middle responsive-table">
    <thead>
      <tr><th>時間</th><th>管理員</th><th>動作</th><th>目標</th><th>metadata</th></tr>
    </thead>
    <tbody>
      <?php foreach ($logs as $log): ?>
        <tr>
          <td data-label="時間"><?= e($log['created_at']) ?></td>
          <td data-label="管理員"><?= e($log['username']) ?></td>
          <td data-label="動作"><?= e($log['action']) ?></td>
          <td data-label="目標"><?= e($log['target_type'] . '#' . $log['target_id']) ?></td>
          <td data-label="metadata"><code><?= e($log['metadata_json']) ?></code></td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>
<?php admin_footer(); ?>
