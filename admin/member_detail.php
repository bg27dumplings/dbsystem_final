<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/includes/audit.php';
require_once __DIR__ . '/includes/layout.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $studentId = (int) ($_POST['student_id'] ?? 0);
    $action = (string) ($_POST['action'] ?? '');

    if ($studentId > 0 && $action === 'delete') {
        db()->prepare('UPDATE students SET status = ?, frozen_reason = NULL, frozen_at = NULL WHERE id = ?')->execute(['deleted', $studentId]);
        log_admin_action((int) $_SESSION['admin_id'], 'delete_student', 'student', $studentId);
    }

    header('Location: /admin/members.php');
    exit;
}

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
$actions = '<div class="d-flex flex-wrap gap-2">'
    . '<a class="btn admin-btn admin-btn--secondary" href="/admin/member_form.php?id=' . e((string) $studentId) . '">編輯會員</a>';
if ($student['status'] !== 'deleted') {
    $actions .= '<form method="post" class="d-inline">'
        . csrf_field()
        . '<input type="hidden" name="student_id" value="' . e((string) $studentId) . '">'
        . '<input type="hidden" name="action" value="delete">'
        . '<button class="btn admin-btn admin-btn--danger" type="submit">刪除會員</button>'
        . '</form>';
}
$actions .= '</div>';
?>
<?php admin_page_header('會員詳情', $student['name'], '查看學生狀態、凍結原因與歷史上架物品。', $actions); ?>
<div class="row g-3">
  <div class="col-12 col-lg-4">
    <section class="card shadow-sm">
      <div class="card-body">
        <h2 class="admin-card-title mb-3">基本資料</h2>
        <dl class="admin-description-list">
          <div><dt>學號</dt><dd><?= e($student['student_no']) ?></dd></div>
          <div><dt>信箱</dt><dd><?= e($student['email']) ?></dd></div>
          <div><dt>狀態</dt><dd><?= admin_status_badge($student['status']) ?></dd></div>
          <div><dt>註冊時間</dt><dd><?= e($student['created_at']) ?></dd></div>
          <div><dt>凍結原因</dt><dd><?= e($student['frozen_reason'] ?? '無') ?></dd></div>
        </dl>
      </div>
    </section>
  </div>
  <div class="col-12 col-lg-8">
    <section class="card shadow-sm">
      <div class="card-body">
        <h2 class="admin-card-title mb-3">上架物品</h2>
        <div class="table-responsive">
          <table class="table responsive-table">
            <thead><tr><th>物品</th><th>狀態</th><th>建立時間</th></tr></thead>
            <tbody>
              <?php foreach ($items as $item): ?>
                <tr>
                  <td data-label="物品"><a class="admin-muted-link" href="/admin/item_review.php?id=<?= e((string) $item['id']) ?>"><?= e($item['title']) ?></a></td>
                  <td data-label="狀態"><?= admin_status_badge($item['status']) ?></td>
                  <td data-label="建立時間"><?= e($item['created_at']) ?></td>
                </tr>
              <?php endforeach; ?>
              <?php if (!$items): ?>
                <tr>
                  <td colspan="3">
                    <div class="admin-empty">目前沒有上架物品紀錄。</div>
                  </td>
                </tr>
              <?php endif; ?>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</div>
<?php admin_footer(); ?>
