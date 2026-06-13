<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/includes/audit.php';
require_once __DIR__ . '/includes/layout.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $itemId = (int) ($_POST['item_id'] ?? 0);
    $reason = trim((string) ($_POST['reason'] ?? ''));

    if ($itemId > 0) {
        db()->prepare('UPDATE items SET status = ?, removed_reason = ?, removed_at = NOW(), removed_by = ? WHERE id = ?')
            ->execute(['violation_removed', $reason, (int) $_SESSION['admin_id'], $itemId]);
        log_admin_action((int) $_SESSION['admin_id'], 'violation_remove_item', 'item', $itemId, ['reason' => $reason]);

    }

    header('Location: /admin/items.php');
    exit;
}

$keyword = trim((string) ($_GET['q'] ?? ''));
$tab = $_GET['tab'] ?? 'all';

$statusCondition = '1=1';
if ($tab === 'pending') {
    $statusCondition = 'i.status = "pending_review"';
} elseif ($tab === 'blocked') {
    $statusCondition = 'i.is_ai_blocked = 1';
}

$stmt = db()->prepare(
    'SELECT i.id, i.title, i.status, i.location, i.created_at, s.name AS seller_name, c.name AS category_name
     FROM items i
     JOIN students s ON s.id = i.student_id
     JOIN categories c ON c.id = i.category_id
     WHERE (:keyword = "" OR i.title LIKE :item_q OR s.name LIKE :seller_q OR c.name LIKE :category_q)
       AND ' . $statusCondition . '
     ORDER BY CASE WHEN i.status = "pending_review" THEN 0 ELSE 1 END, i.created_at DESC'
);
$likeKeyword = '%' . $keyword . '%';
$stmt->execute([
    'keyword' => $keyword,
    'item_q' => $likeKeyword,
    'seller_q' => $likeKeyword,
    'category_q' => $likeKeyword,
]);
$items = $stmt->fetchAll();

admin_header('物品審查');
$searchActions = '
  <form class="d-flex gap-2" role="search">
    <label for="q" class="visually-hidden">搜尋物品、賣家或分類</label>
    <input id="q" name="q" class="form-control" value="' . e($keyword) . '" placeholder="搜尋物品、賣家或分類">
    <button class="btn admin-btn admin-btn--primary" type="submit">搜尋</button>
  </form>';
?>
<?php admin_page_header('物品與內容審查', '全站物品監控', '從賣家、分類與違規處置角度快速檢查平台內容。', $searchActions); ?>
<div class="d-flex flex-wrap gap-2 mb-4">
  <a href="?tab=all<?= $keyword ? '&q='.urlencode($keyword) : '' ?>" 
     class="btn admin-btn <?= $tab === 'all' ? 'admin-btn--primary' : 'admin-btn--secondary' ?>">
    全站物品
  </a>
  <a href="?tab=pending<?= $keyword ? '&q='.urlencode($keyword) : '' ?>" 
     class="btn admin-btn <?= $tab === 'pending' ? 'admin-btn--primary' : 'admin-btn--secondary' ?> position-relative">
    待處理申訴 (人工審核)
  </a>
  <a href="?tab=blocked<?= $keyword ? '&q='.urlencode($keyword) : '' ?>" 
     class="btn admin-btn <?= $tab === 'blocked' ? 'admin-btn--primary' : 'admin-btn--secondary' ?>">
    AI 阻擋紀錄
  </a>
</div>

<div class="table-responsive">
  <table class="table align-middle responsive-table">
    <thead>
      <tr><th>物品</th><th>分類</th><th>賣家</th><th>地點</th><th>狀態</th><th>操作</th></tr>
    </thead>
    <tbody>
      <?php if (empty($items)): ?>
        <tr><td colspan="6" class="text-center text-muted py-4">目前沒有相關物品。</td></tr>
      <?php endif; ?>
      <?php foreach ($items as $item): ?>
        <tr>
          <td data-label="物品"><?= e($item['title']) ?></td>
          <td data-label="分類"><?= e($item['category_name']) ?></td>
          <td data-label="賣家"><?= e($item['seller_name']) ?></td>
          <td data-label="地點"><?= e($item['location']) ?></td>
          <td data-label="狀態"><?= admin_status_badge($item['status'], 'item') ?></td>
          <td data-label="操作">
            <?php if ($item['status'] !== 'violation_removed'): ?>
              <div class="d-flex flex-column flex-sm-row gap-2">
                <a href="/admin/item_review.php?id=<?= e((string) $item['id']) ?>" class="btn admin-btn admin-btn--secondary btn-sm">審查 / 詳情</a>
                <form method="post" class="d-flex flex-column flex-sm-row gap-2">
                  <?= csrf_field() ?>
                  <input type="hidden" name="item_id" value="<?= e((string) $item['id']) ?>">
                  <label class="visually-hidden" for="item-reason-<?= e((string) $item['id']) ?>">違規下架原因</label>
                  <input id="item-reason-<?= e((string) $item['id']) ?>" name="reason" class="form-control form-control-sm" placeholder="違規原因" required>
                  <button class="btn admin-btn admin-btn--danger btn-sm" type="submit">違規下架</button>
                </form>
              </div>
            <?php else: ?>
              <span class="admin-badge admin-badge--neutral"><span aria-hidden="true" class="admin-badge__dot"></span>已處置</span>
            <?php endif; ?>
          </td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>
<?php admin_footer(); ?>
