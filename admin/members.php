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
    $reason = trim((string) ($_POST['reason'] ?? ''));

    if ($studentId > 0 && $action === 'freeze') {
        db()->prepare('UPDATE students SET status = ?, frozen_reason = ?, frozen_at = NOW() WHERE id = ?')->execute(['frozen', $reason, $studentId]);
        log_admin_action((int) $_SESSION['admin_id'], 'freeze_student', 'student', $studentId, ['reason' => $reason]);
    }

    if ($studentId > 0 && $action === 'unfreeze') {
        db()->prepare('UPDATE students SET status = ?, frozen_reason = NULL, frozen_at = NULL WHERE id = ?')->execute(['active', $studentId]);
        log_admin_action((int) $_SESSION['admin_id'], 'unfreeze_student', 'student', $studentId);
    }

    header('Location: /admin/members.php');
    exit;
}

$keyword = trim((string) ($_GET['q'] ?? ''));
$stmt = db()->prepare(
    'SELECT id, student_no, name, status, frozen_reason, created_at
     FROM students
     WHERE (:q = "" OR student_no LIKE :like_q OR name LIKE :like_q)
     ORDER BY created_at DESC'
);
$stmt->execute(['q' => $keyword, 'like_q' => '%' . $keyword . '%']);
$students = $stmt->fetchAll();

admin_header('會員管理');
?>
<div class="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
  <div>
    <p class="text-success fw-bold mb-1">會員管理</p>
    <h1 class="h2 fw-bold">全站會員列表</h1>
  </div>
  <form class="d-flex gap-2" role="search">
    <label for="q" class="visually-hidden">搜尋學號或姓名</label>
    <input id="q" name="q" class="form-control" value="<?= e($keyword) ?>" placeholder="搜尋學號或姓名">
    <button class="btn btn-dark" type="submit">搜尋</button>
  </form>
</div>
<div class="table-responsive">
  <table class="table align-middle responsive-table">
    <thead>
      <tr><th>學號</th><th>姓名</th><th>註冊時間</th><th>狀態</th><th>操作</th></tr>
    </thead>
    <tbody>
      <?php foreach ($students as $student): ?>
        <tr>
          <td data-label="學號"><?= e($student['student_no']) ?></td>
          <td data-label="姓名"><?= e($student['name']) ?></td>
          <td data-label="註冊時間"><?= e($student['created_at']) ?></td>
          <td data-label="狀態"><span class="badge <?= $student['status'] === 'frozen' ? 'text-bg-warning' : 'text-bg-success' ?>"><?= e($student['status']) ?></span></td>
          <td data-label="操作">
            <form method="post" class="d-flex flex-column flex-sm-row gap-2">
              <?= csrf_field() ?>
              <input type="hidden" name="student_id" value="<?= e((string) $student['id']) ?>">
              <?php if ($student['status'] === 'frozen'): ?>
                <input type="hidden" name="action" value="unfreeze">
                <button class="btn btn-outline-success btn-sm" type="submit">解除凍結</button>
              <?php else: ?>
                <input type="hidden" name="action" value="freeze">
                <label class="visually-hidden" for="reason-<?= e((string) $student['id']) ?>">凍結原因</label>
                <input id="reason-<?= e((string) $student['id']) ?>" name="reason" class="form-control form-control-sm" placeholder="凍結原因" required>
                <button class="btn btn-outline-danger btn-sm" type="submit">凍結</button>
              <?php endif; ?>
            </form>
          </td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>
<?php admin_footer(); ?>
