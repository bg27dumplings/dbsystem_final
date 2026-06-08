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

    if ($studentId > 0 && $action === 'delete') {
        db()->prepare('UPDATE students SET status = ?, frozen_reason = NULL, frozen_at = NULL WHERE id = ?')->execute(['deleted', $studentId]);
        log_admin_action((int) $_SESSION['admin_id'], 'delete_student', 'student', $studentId);
    }

    header('Location: /admin/members.php');
    exit;
}

$keyword = trim((string) ($_GET['q'] ?? ''));
$stmt = db()->prepare(
    'SELECT id, student_no, name, status, frozen_reason, created_at
     FROM students
     WHERE (:keyword = "" OR student_no LIKE :student_no_q OR name LIKE :name_q)
     ORDER BY created_at DESC'
);
$likeKeyword = '%' . $keyword . '%';
$stmt->execute([
    'keyword' => $keyword,
    'student_no_q' => $likeKeyword,
    'name_q' => $likeKeyword,
]);
$students = $stmt->fetchAll();

admin_header('會員管理');
$searchActions = '
  <div class="d-flex flex-wrap gap-2">
  <form class="d-flex gap-2" role="search">
    <label for="q" class="visually-hidden">搜尋學號或姓名</label>
    <input id="q" name="q" class="form-control" value="' . e($keyword) . '" placeholder="搜尋學號或姓名">
    <button class="btn admin-btn admin-btn--primary" type="submit">搜尋</button>
  </form>
  <a class="btn admin-btn admin-btn--secondary" href="/admin/member_form.php">新增會員</a>
  </div>';
?>
<?php admin_page_header('會員管理', '全站會員列表', '快速查看學生帳號狀態、凍結原因與最近註冊資料。', $searchActions); ?>
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
          <td data-label="狀態"><?= admin_status_badge($student['status'], 'member') ?></td>
          <td data-label="操作">
            <div class="d-flex flex-wrap align-items-center gap-2">
              <a class="btn admin-btn admin-btn--secondary btn-sm" href="/admin/member_detail.php?id=<?= e((string) $student['id']) ?>">查看</a>
              <a class="btn admin-btn admin-btn--secondary btn-sm" href="/admin/member_form.php?id=<?= e((string) $student['id']) ?>">編輯</a>
              <?php if ($student['status'] !== 'deleted'): ?>
                <?php if ($student['status'] === 'frozen'): ?>
                  <button
                    class="btn admin-btn admin-btn--secondary btn-sm"
                    type="button"
                    data-bs-toggle="modal"
                    data-bs-target="#unfreezeStudentModal"
                    data-student-id="<?= e((string) $student['id']) ?>"
                    data-student-name="<?= e($student['name']) ?>"
                  >
                    解除凍結
                  </button>
                <?php else: ?>
                  <button
                    class="btn admin-btn admin-btn--danger btn-sm"
                    type="button"
                    data-bs-toggle="modal"
                    data-bs-target="#freezeStudentModal"
                    data-student-id="<?= e((string) $student['id']) ?>"
                    data-student-name="<?= e($student['name']) ?>"
                  >
                    凍結
                  </button>
                <?php endif; ?>
                <button
                  class="btn admin-btn admin-btn--danger btn-sm"
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#deleteStudentModal"
                  data-student-id="<?= e((string) $student['id']) ?>"
                  data-student-name="<?= e($student['name']) ?>"
                >
                  刪除
                </button>
              <?php endif; ?>
            </div>
          </td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>
<div class="modal fade" id="freezeStudentModal" tabindex="-1" aria-labelledby="freezeStudentModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content admin-modal">
      <form method="post">
        <div class="modal-header border-0 pb-0">
          <div>
            <p class="admin-kicker mb-2">會員操作</p>
            <h2 class="modal-title h4 mb-0" id="freezeStudentModalLabel">凍結會員</h2>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
        </div>
        <div class="modal-body pt-3">
          <?= csrf_field() ?>
          <input type="hidden" name="student_id" id="freeze-student-id">
          <input type="hidden" name="action" value="freeze">
          <p class="text-secondary mb-3">
            你將凍結 <span class="fw-bold text-dark" id="freeze-student-name">這位會員</span>。請輸入凍結原因。
          </p>
          <label for="freeze-reason" class="form-label fw-semibold">凍結原因</label>
          <textarea id="freeze-reason" name="reason" class="form-control" rows="4" placeholder="例如：多次違規刊登、惡意棄單、身分驗證異常" required></textarea>
        </div>
        <div class="modal-footer border-0 pt-0">
          <button type="button" class="btn admin-btn admin-btn--secondary" data-bs-dismiss="modal">取消</button>
          <button type="submit" class="btn admin-btn admin-btn--danger">確定</button>
        </div>
      </form>
    </div>
  </div>
</div>
<div class="modal fade" id="unfreezeStudentModal" tabindex="-1" aria-labelledby="unfreezeStudentModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content admin-modal">
      <form method="post">
        <div class="modal-header border-0 pb-0">
          <div>
            <p class="admin-kicker mb-2">會員操作</p>
            <h2 class="modal-title h4 mb-0" id="unfreezeStudentModalLabel">解除凍結</h2>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
        </div>
        <div class="modal-body pt-3">
          <?= csrf_field() ?>
          <input type="hidden" name="student_id" id="unfreeze-student-id">
          <input type="hidden" name="action" value="unfreeze">
          <p class="text-secondary mb-0">
            確定要解除 <span class="fw-bold text-dark" id="unfreeze-student-name">這位會員</span> 的凍結狀態嗎？解除後該帳號將可重新登入與使用平台功能。
          </p>
        </div>
        <div class="modal-footer border-0 pt-0">
          <button type="button" class="btn admin-btn admin-btn--secondary" data-bs-dismiss="modal">取消</button>
          <button type="submit" class="btn admin-btn admin-btn--primary">確定</button>
        </div>
      </form>
    </div>
  </div>
</div>
<div class="modal fade" id="deleteStudentModal" tabindex="-1" aria-labelledby="deleteStudentModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content admin-modal">
      <form method="post">
        <div class="modal-header border-0 pb-0">
          <div>
            <p class="admin-kicker mb-2">會員操作</p>
            <h2 class="modal-title h4 mb-0" id="deleteStudentModalLabel">刪除會員</h2>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
        </div>
        <div class="modal-body pt-3">
          <?= csrf_field() ?>
          <input type="hidden" name="student_id" id="delete-student-id">
          <input type="hidden" name="action" value="delete">
          <p class="text-secondary mb-0">
            你即將將 <span class="fw-bold text-dark" id="delete-student-name">這位會員</span> 標記為已刪除。此操作會停用帳號，但不會移除關聯資料。
          </p>
        </div>
        <div class="modal-footer border-0 pt-0">
          <button type="button" class="btn admin-btn admin-btn--secondary" data-bs-dismiss="modal">取消</button>
          <button type="submit" class="btn admin-btn admin-btn--danger">確定刪除</button>
        </div>
      </form>
    </div>
  </div>
</div>
<script>
const freezeStudentModal = document.getElementById('freezeStudentModal');
if (freezeStudentModal) {
  freezeStudentModal.addEventListener('show.bs.modal', (event) => {
    const trigger = event.relatedTarget;
    if (!(trigger instanceof HTMLElement)) {
      return;
    }

    const studentId = trigger.getAttribute('data-student-id') ?? '';
    const studentName = trigger.getAttribute('data-student-name') ?? '這位會員';
    const studentIdInput = freezeStudentModal.querySelector('#freeze-student-id');
    const studentNameText = freezeStudentModal.querySelector('#freeze-student-name');
    const reasonInput = freezeStudentModal.querySelector('#freeze-reason');

    if (studentIdInput instanceof HTMLInputElement) {
      studentIdInput.value = studentId;
    }

    if (studentNameText) {
      studentNameText.textContent = studentName;
    }

    if (reasonInput instanceof HTMLTextAreaElement) {
      reasonInput.value = '';
      window.setTimeout(() => reasonInput.focus(), 120);
    }
  });
}

const unfreezeStudentModal = document.getElementById('unfreezeStudentModal');
if (unfreezeStudentModal) {
  unfreezeStudentModal.addEventListener('show.bs.modal', (event) => {
    const trigger = event.relatedTarget;
    if (!(trigger instanceof HTMLElement)) {
      return;
    }

    const studentId = trigger.getAttribute('data-student-id') ?? '';
    const studentName = trigger.getAttribute('data-student-name') ?? '這位會員';
    const studentIdInput = unfreezeStudentModal.querySelector('#unfreeze-student-id');
    const studentNameText = unfreezeStudentModal.querySelector('#unfreeze-student-name');

    if (studentIdInput instanceof HTMLInputElement) {
      studentIdInput.value = studentId;
    }

    if (studentNameText) {
      studentNameText.textContent = studentName;
    }
  });
}

const deleteStudentModal = document.getElementById('deleteStudentModal');
if (deleteStudentModal) {
  deleteStudentModal.addEventListener('show.bs.modal', (event) => {
    const trigger = event.relatedTarget;
    if (!(trigger instanceof HTMLElement)) {
      return;
    }

    const studentId = trigger.getAttribute('data-student-id') ?? '';
    const studentName = trigger.getAttribute('data-student-name') ?? '這位會員';
    const studentIdInput = deleteStudentModal.querySelector('#delete-student-id');
    const studentNameText = deleteStudentModal.querySelector('#delete-student-name');

    if (studentIdInput instanceof HTMLInputElement) {
      studentIdInput.value = studentId;
    }

    if (studentNameText) {
      studentNameText.textContent = studentName;
    }
  });
}
</script>
<?php admin_footer(); ?>
