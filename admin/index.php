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
$appointmentStatusRows = $dashboard['appointmentStatusRows'];
$exchangeModeRows = $dashboard['exchangeModeRows'];
$itemMonthRows = $dashboard['itemMonthRows'];

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

<div class="row g-3 mb-3">
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

<div class="row g-3">
  <div class="col-12 col-md-4">
    <section class="card chart-box shadow-sm">
      <div class="card-body">
        <h2 class="h5 fw-bold">面交預約狀態</h2>
        <div class="admin-chart-frame">
          <canvas id="appointmentChart" aria-label="面交預約狀態圓餅圖" role="img"></canvas>
        </div>
      </div>
    </section>
  </div>
  <div class="col-12 col-md-4">
    <section class="card chart-box shadow-sm">
      <div class="card-body">
        <h2 class="h5 fw-bold">熱門交易模式</h2>
        <div class="admin-chart-frame">
          <canvas id="exchangeModeChart" aria-label="交易模式長條圖" role="img"></canvas>
        </div>
      </div>
    </section>
  </div>
  <div class="col-12 col-md-4">
    <section class="card chart-box shadow-sm">
      <div class="card-body">
        <h2 class="h5 fw-bold">每月新增物品</h2>
        <div class="admin-chart-frame">
          <canvas id="itemMonthChart" aria-label="每月新增物品折線圖" role="img"></canvas>
        </div>
      </div>
    </section>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
const categoryRows = <?= json_encode($categoryRows, JSON_UNESCAPED_UNICODE) ?>;
const monthRows = <?= json_encode($monthRows, JSON_UNESCAPED_UNICODE) ?>;
const appointmentStatusRows = <?= json_encode($appointmentStatusRows, JSON_UNESCAPED_UNICODE) ?>;
const exchangeModeRows = <?= json_encode($exchangeModeRows, JSON_UNESCAPED_UNICODE) ?>;
const itemMonthRows = <?= json_encode($itemMonthRows, JSON_UNESCAPED_UNICODE) ?>;

// 共同設定
const commonOptions = {
  animation: false,
  responsive: true,
  maintainAspectRatio: false
};

const colors = ['#256D5A', '#1D5F8D', '#E7A83E', '#B8443C', '#6B7280', '#8B5CF6'];

new Chart(document.getElementById('categoryChart'), {
  type: 'pie',
  data: {
    labels: categoryRows.map(row => row.name),
    datasets: [{ data: categoryRows.map(row => Number(row.total)), backgroundColor: colors }]
  },
  options: commonOptions
});

new Chart(document.getElementById('memberChart'), {
  type: 'line',
  data: {
    labels: monthRows.map(row => row.month),
    datasets: [{ label: '新增會員', data: monthRows.map(row => Number(row.total)), borderColor: '#256D5A', backgroundColor: 'rgba(37,109,90,.15)', tension: .25, fill: true }]
  },
  options: commonOptions
});

const statusMap = {
  'pending': '待處理',
  'accepted': '已接受',
  'rejected': '已拒絕',
  'cancelled': '已取消',
  'completed': '已完成'
};

new Chart(document.getElementById('appointmentChart'), {
  type: 'doughnut',
  data: {
    labels: appointmentStatusRows.map(row => statusMap[row.status] || row.status),
    datasets: [{ data: appointmentStatusRows.map(row => Number(row.total)), backgroundColor: colors }]
  },
  options: commonOptions
});

const modeMap = {
  'free': '免費',
  'price': '現金',
  'food': '請客(食物)',
  'drink': '請客(飲料)',
  'custom': '自訂'
};

new Chart(document.getElementById('exchangeModeChart'), {
  type: 'bar',
  data: {
    labels: exchangeModeRows.map(row => modeMap[row.exchange_mode] || row.exchange_mode),
    datasets: [{ label: '物品數量', data: exchangeModeRows.map(row => Number(row.total)), backgroundColor: '#1D5F8D' }]
  },
  options: commonOptions
});

new Chart(document.getElementById('itemMonthChart'), {
  type: 'line',
  data: {
    labels: itemMonthRows.map(row => row.month),
    datasets: [{ label: '新增物品', data: itemMonthRows.map(row => Number(row.total)), borderColor: '#E7A83E', backgroundColor: 'rgba(231,168,62,.15)', tension: .25, fill: true }]
  },
  options: commonOptions
});
</script>
<?php admin_footer(); ?>
