<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/dashboard.php';
require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/includes/layout.php';

require_admin();

$dashboard = get_dashboard_snapshot();
$stats = $dashboard['stats'];
$categoryRows = $dashboard['categoryRows'];
$monthRows = $dashboard['monthRows'];

admin_header('Dashboard');
?>
<?php admin_page_header('統計分析及視覺化', '即時數據看板', '用同一套品牌語言觀察會員、物品與交易狀態。'); ?>
<div class="row g-3 mb-4">
  <?php foreach ([['會員總數', $stats['members']], ['凍結會員', $stats['frozen']], ['上架物品', $stats['active_items']], ['成功交換', $stats['completed']]] as $card): ?>
    <div class="col-6 col-xl-3">
      <section class="card stat-card shadow-sm" aria-label="<?= e($card[0]) ?>">
        <div class="card-body">
          <p class="admin-kicker mb-2"><?= e($card[0]) ?></p>
          <p class="display-6 fw-bold mb-0"><?= e((string) $card[1]) ?></p>
        </div>
      </section>
    </div>
  <?php endforeach; ?>
</div>
<div class="row g-3">
  <div class="col-12 col-xl-5">
    <section class="card chart-box shadow-sm">
      <div class="card-body">
        <h2 class="h5 fw-bold">物品類別分佈</h2>
        <div class="admin-chart-frame">
          <canvas id="categoryChart" aria-label="物品類別分佈圓餅圖" role="img"></canvas>
        </div>
      </div>
    </section>
  </div>
  <div class="col-12 col-xl-7">
    <section class="card chart-box shadow-sm">
      <div class="card-body">
        <h2 class="h5 fw-bold">每月新註冊趨勢</h2>
        <div class="admin-chart-frame">
          <canvas id="memberChart" aria-label="每月新註冊折線圖" role="img"></canvas>
        </div>
      </div>
    </section>
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
const categoryRows = <?= json_encode($categoryRows, JSON_UNESCAPED_UNICODE) ?>;
const monthRows = <?= json_encode($monthRows, JSON_UNESCAPED_UNICODE) ?>;
new Chart(document.getElementById('categoryChart'), {
  type: 'pie',
  data: {
    labels: categoryRows.map(row => row.name),
    datasets: [{ data: categoryRows.map(row => Number(row.total)), backgroundColor: ['#256D5A', '#1D5F8D', '#E7A83E', '#B8443C', '#6B7280'] }]
  },
  options: {
    animation: false,
    responsive: true,
    maintainAspectRatio: false
  }
});
new Chart(document.getElementById('memberChart'), {
  type: 'line',
  data: {
    labels: monthRows.map(row => row.month),
    datasets: [{ label: '新增會員', data: monthRows.map(row => Number(row.total)), borderColor: '#256D5A', backgroundColor: 'rgba(37,109,90,.15)', tension: .25, fill: true }]
  },
  options: {
    animation: false,
    responsive: true,
    maintainAspectRatio: false
  }
});
</script>
<?php admin_footer(); ?>
