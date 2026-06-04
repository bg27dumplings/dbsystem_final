<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/includes/audit.php';
require_once __DIR__ . '/includes/layout.php';

require_admin();

$itemId = (int) ($_GET['id'] ?? $_POST['item_id'] ?? 0);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = (string) ($_POST['action'] ?? '');
    $reason = trim((string) ($_POST['reason'] ?? ''));
    $status = match ($action) {
        'restore' => 'active',
        'remove' => 'removed',
        default => 'violation_removed',
    };

    db()->prepare('UPDATE items SET status = ?, removed_reason = ?, removed_at = NOW(), removed_by = ? WHERE id = ?')
        ->execute([$status, $reason, (int) $_SESSION['admin_id'], $itemId]);
    log_admin_action((int) $_SESSION['admin_id'], $action . '_item', 'item', $itemId, ['reason' => $reason, 'status' => $status]);
    header('Location: /admin/item_review.php?id=' . $itemId);
    exit;
}

$stmt = db()->prepare(
    'SELECT i.*, s.name AS seller_name, s.student_no, c.name AS category_name
     FROM items i
     JOIN students s ON s.id = i.student_id
     JOIN categories c ON c.id = i.category_id
     WHERE i.id = ?'
);
$stmt->execute([$itemId]);
$item = $stmt->fetch();

if (!$item) {
    http_response_code(404);
    exit('Item not found');
}

$imagesStmt = db()->prepare('SELECT * FROM item_images WHERE item_id = ? ORDER BY sort_order');
$imagesStmt->execute([$itemId]);
$images = $imagesStmt->fetchAll();

admin_header('物品審查詳情');
?>
<div class="mb-4">
  <p class="text-success fw-bold mb-1">物品審查</p>
  <h1 class="h2 fw-bold"><?= e($item['title']) ?></h1>
</div>
<div class="row g-3">
  <div class="col-12 col-lg-7">
    <section class="card shadow-sm">
      <div class="card-body">
        <h2 class="h5 fw-bold">物品內容</h2>
        <dl>
          <dt>分類</dt><dd><?= e($item['category_name']) ?></dd>
          <dt>賣家</dt><dd><?= e($item['seller_name'] . ' / ' . $item['student_no']) ?></dd>
          <dt>狀態</dt><dd><?= e($item['status']) ?></dd>
          <dt>交換條件</dt><dd><?= e($item['exchange_note']) ?></dd>
          <dt>地點</dt><dd><?= e($item['location']) ?></dd>
          <dt>描述</dt><dd><?= nl2br(e($item['description'])) ?></dd>
        </dl>
      </div>
    </section>
  </div>
  <div class="col-12 col-lg-5">
    <section class="card shadow-sm mb-3">
      <div class="card-body">
        <h2 class="h5 fw-bold">圖片</h2>
        <?php if (!$images): ?>
          <p class="text-muted">尚無圖片。</p>
        <?php endif; ?>
        <div class="row g-2">
          <?php foreach ($images as $image): ?>
            <div class="col-6">
              <img src="<?= e($image['public_url']) ?>" alt="<?= e($image['alt_text']) ?>" class="img-fluid rounded border">
            </div>
          <?php endforeach; ?>
        </div>
      </div>
    </section>
    <section class="card shadow-sm">
      <div class="card-body">
        <h2 class="h5 fw-bold">審查操作</h2>
        <form method="post" class="vstack gap-3">
          <?= csrf_field() ?>
          <input type="hidden" name="item_id" value="<?= e((string) $item['id']) ?>">
          <div>
            <label for="action" class="form-label fw-semibold">操作</label>
            <select id="action" name="action" class="form-select">
              <option value="restore">還原上架</option>
              <option value="remove">一般下架</option>
              <option value="violation_remove">違規下架</option>
            </select>
          </div>
          <div>
            <label for="reason" class="form-label fw-semibold">原因</label>
            <textarea id="reason" name="reason" class="form-control" rows="3"></textarea>
          </div>
          <button class="btn btn-dark fw-bold" type="submit">送出審查</button>
        </form>
      </div>
    </section>
  </div>
</div>
<?php admin_footer(); ?>
