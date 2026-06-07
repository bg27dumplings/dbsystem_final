<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/includes/audit.php';
require_once __DIR__ . '/includes/layout.php';

require_admin();

$studentId = (int) ($_GET['id'] ?? $_POST['student_id'] ?? 0);
$isEdit = $studentId > 0;

$student = [
    'id' => 0,
    'student_no' => '',
    'name' => '',
    'email' => '',
    'status' => 'active',
    'frozen_reason' => '',
];

if ($isEdit) {
    $stmt = db()->prepare('SELECT * FROM students WHERE id = ? LIMIT 1');
    $stmt->execute([$studentId]);
    $existingStudent = $stmt->fetch();

    if (!$existingStudent) {
        http_response_code(404);
        exit('Member not found');
    }

    $student = [
        'id' => (int) $existingStudent['id'],
        'student_no' => (string) $existingStudent['student_no'],
        'name' => (string) $existingStudent['name'],
        'email' => (string) $existingStudent['email'],
        'status' => (string) $existingStudent['status'],
        'frozen_reason' => (string) ($existingStudent['frozen_reason'] ?? ''),
    ];
}

$errors = [];

function is_valid_student_no(string $studentNo): bool
{
    if (!preg_match('/^[A-Z]{3}(\d{3})(\d{3})$/', $studentNo, $matches)) {
        return false;
    }

    $enrollmentYear = (int) $matches[1];
    $currentRocYear = (int) date('Y') - 1911;

    return $enrollmentYear >= 1 && $enrollmentYear <= $currentRocYear + 1;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();

    $studentNo = strtoupper(trim((string) ($_POST['student_no'] ?? '')));
    $name = trim((string) ($_POST['name'] ?? ''));
    $email = trim((string) ($_POST['email'] ?? ''));
    $status = (string) ($_POST['status'] ?? 'active');
    $frozenReason = trim((string) ($_POST['frozen_reason'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    $student = [
        'id' => $studentId,
        'student_no' => $studentNo,
        'name' => $name,
        'email' => $email,
        'status' => $status,
        'frozen_reason' => $frozenReason,
    ];

    if ($studentNo === '') {
        $errors['student_no'] = '請輸入學號。';
    } elseif (!is_valid_student_no($studentNo)) {
        $errors['student_no'] = '學號格式不正確，需為 3 個英文字加 6 個數字，且中間 3 碼為民國入學年。';
    }

    if ($name === '') {
        $errors['name'] = '請輸入姓名。';
    }

    if ($email === '') {
        $errors['email'] = '請輸入信箱。';
    } elseif (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        $errors['email'] = '請輸入有效的電子郵件格式。';
    }

    $allowedStatuses = ['active', 'frozen', 'deleted'];
    if (!in_array($status, $allowedStatuses, true)) {
        $errors['status'] = '會員狀態不合法。';
    }

    if ($status === 'frozen' && $frozenReason === '') {
        $errors['frozen_reason'] = '凍結會員時請填寫原因。';
    }

    if (!$isEdit && $password === '') {
        $errors['password'] = '新增會員時必須設定密碼。';
    } elseif ($password !== '' && strlen($password) < 8) {
        $errors['password'] = '密碼至少需要 8 個字元。';
    }

    $studentNoStmt = db()->prepare('SELECT id FROM students WHERE student_no = ? AND id <> ? LIMIT 1');
    $studentNoStmt->execute([$studentNo, $studentId]);
    if ($studentNo !== '' && $studentNoStmt->fetch()) {
        $errors['student_no'] = '這個學號已經存在。';
    }

    $emailStmt = db()->prepare('SELECT id FROM students WHERE email = ? AND id <> ? LIMIT 1');
    $emailStmt->execute([$email, $studentId]);
    if ($email !== '' && $emailStmt->fetch()) {
        $errors['email'] = '這個信箱已經被使用。';
    }

    if (!$errors) {
        $passwordHash = $password !== '' ? password_hash($password, PASSWORD_DEFAULT) : null;
        $finalFrozenReason = $status === 'frozen' ? $frozenReason : null;
        $finalFrozenAt = $status === 'frozen' ? date('Y-m-d H:i:s') : null;

        if ($isEdit) {
            if ($passwordHash !== null) {
                db()->prepare(
                    'UPDATE students
                     SET student_no = ?, name = ?, email = ?, password_hash = ?, status = ?, frozen_reason = ?, frozen_at = ?
                     WHERE id = ?'
                )->execute([
                    $studentNo,
                    $name,
                    $email,
                    $passwordHash,
                    $status,
                    $finalFrozenReason,
                    $finalFrozenAt,
                    $studentId,
                ]);
            } else {
                db()->prepare(
                    'UPDATE students
                     SET student_no = ?, name = ?, email = ?, status = ?, frozen_reason = ?, frozen_at = ?
                     WHERE id = ?'
                )->execute([
                    $studentNo,
                    $name,
                    $email,
                    $status,
                    $finalFrozenReason,
                    $finalFrozenAt,
                    $studentId,
                ]);
            }

            log_admin_action((int) $_SESSION['admin_id'], 'update_student', 'student', $studentId, [
                'status' => $status,
                'password_reset' => $passwordHash !== null,
            ]);
        } else {
            db()->prepare(
                'INSERT INTO students (student_no, name, email, password_hash, status, frozen_reason, frozen_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            )->execute([
                $studentNo,
                $name,
                $email,
                (string) $passwordHash,
                $status,
                $finalFrozenReason,
                $finalFrozenAt,
            ]);
            $studentId = (int) db()->lastInsertId();
            log_admin_action((int) $_SESSION['admin_id'], 'create_student', 'student', $studentId, [
                'status' => $status,
            ]);
        }

        header('Location: /admin/member_detail.php?id=' . $studentId);
        exit;
    }
}

admin_header($isEdit ? '編輯會員' : '新增會員');
$title = $isEdit ? '編輯會員資料' : '新增會員';
$description = $isEdit
    ? '更新學生基本資料、登入信箱、狀態與密碼。'
    : '建立新的學生帳號，並決定初始狀態與登入密碼。';
?>
<?php admin_page_header('會員維護', $title, $description); ?>
<section class="card shadow-sm">
  <div class="card-body">
    <?php if ($errors): ?>
      <div class="alert alert-danger" role="alert">請先修正表單錯誤，再重新送出。</div>
    <?php endif; ?>
    <form method="post" class="row g-3">
      <?= csrf_field() ?>
      <input type="hidden" name="student_id" value="<?= e((string) $studentId) ?>">
      <div class="col-12 col-md-6">
        <label for="student_no" class="form-label fw-semibold">學號</label>
        <input id="student_no" name="student_no" class="form-control" value="<?= e($student['student_no']) ?>" placeholder="ABC113001" required>
        <div class="form-text">格式為 3 個英文字加 6 個數字，例如 ABC113001；中間 3 碼代表民國入學年。</div>
        <?php if (isset($errors['student_no'])): ?><div class="text-danger small mt-2"><?= e($errors['student_no']) ?></div><?php endif; ?>
      </div>
      <div class="col-12 col-md-6">
        <label for="name" class="form-label fw-semibold">姓名</label>
        <input id="name" name="name" class="form-control" value="<?= e($student['name']) ?>" required>
        <?php if (isset($errors['name'])): ?><div class="text-danger small mt-2"><?= e($errors['name']) ?></div><?php endif; ?>
      </div>
      <div class="col-12 col-md-6">
        <label for="email" class="form-label fw-semibold">電子信箱</label>
        <input id="email" name="email" type="email" class="form-control" value="<?= e($student['email']) ?>" required>
        <?php if (isset($errors['email'])): ?><div class="text-danger small mt-2"><?= e($errors['email']) ?></div><?php endif; ?>
      </div>
      <div class="col-12 col-md-6">
        <label for="status" class="form-label fw-semibold">狀態</label>
        <select id="status" name="status" class="form-select">
          <?php foreach (['active' => '啟用', 'frozen' => '凍結', 'deleted' => '已刪除'] as $value => $label): ?>
            <option value="<?= e($value) ?>" <?= $student['status'] === $value ? 'selected' : '' ?>><?= e($label) ?></option>
          <?php endforeach; ?>
        </select>
        <?php if (isset($errors['status'])): ?><div class="text-danger small mt-2"><?= e($errors['status']) ?></div><?php endif; ?>
      </div>
      <div class="col-12">
        <label for="frozen_reason" class="form-label fw-semibold">凍結原因</label>
        <textarea id="frozen_reason" name="frozen_reason" class="form-control" rows="3" placeholder="只有狀態為凍結時才需要填寫"><?= e($student['frozen_reason']) ?></textarea>
        <?php if (isset($errors['frozen_reason'])): ?><div class="text-danger small mt-2"><?= e($errors['frozen_reason']) ?></div><?php endif; ?>
      </div>
      <div class="col-12">
        <label for="password" class="form-label fw-semibold"><?= $isEdit ? '重設密碼（留白則不變更）' : '初始密碼' ?></label>
        <input id="password" name="password" type="password" class="form-control" <?= $isEdit ? '' : 'required' ?>>
        <?php if (isset($errors['password'])): ?><div class="text-danger small mt-2"><?= e($errors['password']) ?></div><?php endif; ?>
      </div>
      <div class="col-12 d-flex flex-wrap gap-2">
        <button class="btn admin-btn admin-btn--primary" type="submit"><?= $isEdit ? '儲存變更' : '建立會員' ?></button>
        <a class="btn admin-btn admin-btn--secondary" href="<?= e($isEdit ? '/admin/member_detail.php?id=' . $studentId : '/admin/members.php') ?>">取消</a>
      </div>
    </form>
  </div>
</section>
<?php admin_footer(); ?>
