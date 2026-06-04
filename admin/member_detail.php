<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/includes/layout.php';

require_admin();

$studentId = (int) ($_GET['id'] ?? 0);
$stmt = db()->prepare('SELECT * FROM students WHERE id = ?');
$stmt->execute([$studentId]);
$student = $stmt->fetch();

if (!$student) {
    http_response_code(404);
    exit('Member not found');
}

$itemsStmt = db()->prepare('SELECT id, title, status, created_at FROM items WHERE student_id = ? ORDER BY created_at DESC');
$itemsStmt->execute([$studentId]);
$items = $itemsStmt->fetchAll();

admin_header('會員詳情');
?>
<div class="mb-4">
  <p class="text-success fw-bold mb-1">會員詳情</p>
  <h1 class="h2 fw-bold"><?= e($student['name']) ?></h1>
</div>
<div class="row g-3">
  <div class="col-12 col-lg-4">
    <section class="card shadow-sm">
      <div class="card-body">
        <h2 class="h5 fw-bold">基本資料</h2>
        <dl class="mb-0">
          <dt>學號</dt><dd><?= e($student['student_no']) ?></dd>
          <dt>狀態</dt><dd><?= e($student['status']) ?></dd>
          <dt>註冊時間</dt><dd><?= e($student['created_at']) ?></dd>
          <dt>凍結原因</dt><dd><?= e($student['frozen_reason'] ?? '無') ?></dd>
        </dl>
      </div>
    </section>
  </div>
  <div class="col-12 col-lg-8">
    <section class="card shadow-sm">
      <div class="card-body">
        <h2 class="h5 fw-bold">上架物品</h2>
        <div class="table-responsive">
          <table class="table responsive-table">
            <thead><tr><th>物品</th><th>狀態</th><th>建立時間</th></tr></thead>
            <tbody>
              <?php foreach ($items as $item): ?>
                <tr>
                  <td data-label="物品"><a href="/admin/item_review.php?id=<?= e((string) $item['id']) ?>"><?= e($item['title']) ?></a></td>
                  <td data-label="狀態"><?= e($item['status']) ?></td>
                  <td data-label="建立時間"><?= e($item['created_at']) ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</div>
<?php admin_footer(); ?>
