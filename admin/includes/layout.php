<?php
declare(strict_types=1);

require_once __DIR__ . '/security.php';

function asset_url(string $absolutePath, string $publicPath): string
{
    $version = @filemtime($absolutePath);
    if ($version === false) {
        return $publicPath;
    }

    return $publicPath . '?v=' . $version;
}

function admin_header(string $title): void
{
    echo '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">';
    echo '<meta name="viewport" content="width=device-width, initial-scale=1">';
    echo '<title>' . e($title) . ' - 校園共享後台</title>';
    echo '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">';
    echo '<link href="' . e(asset_url(dirname(__DIR__, 2) . '/styles/brand-tokens.css', '/styles/brand-tokens.css')) . '" rel="stylesheet">';
    echo '<link href="' . e(asset_url(__DIR__ . '/../assets/admin-core.css', '/admin/assets/admin-core.css')) . '" rel="stylesheet">';
    echo '<link href="' . e(asset_url(__DIR__ . '/../assets/admin-auth.css', '/admin/assets/admin-auth.css')) . '" rel="stylesheet">';
    echo '<link href="' . e(asset_url(__DIR__ . '/../assets/admin-responsive.css', '/admin/assets/admin-responsive.css')) . '" rel="stylesheet">';
    echo '</head><body class="admin-body">';
    echo '<a class="skip-link" href="#admin-main">跳到主要內容</a>';
    echo '<nav class="navbar navbar-expand-lg admin-navbar"><div class="container-fluid admin-navbar__inner">';
    echo '<a class="navbar-brand admin-brand" href="/admin/index.php"><span class="admin-brand__eyebrow">Campus Share Admin</span><span class="admin-brand__title">校園共享後台</span></a>';
    echo '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNav" aria-controls="adminNav" aria-expanded="false" aria-label="切換導覽"><span class="navbar-toggler-icon"></span></button>';
    echo '<div class="collapse navbar-collapse" id="adminNav"><ul class="navbar-nav me-auto">';
    $links = [
        '/admin/index.php' => 'Dashboard',
        '/admin/members.php' => '會員管理',
        '/admin/items.php' => '物品審查',
        '/admin/logs.php' => '操作紀錄',
    ];
    $currentPath = (string) ($_SERVER['SCRIPT_NAME'] ?? '');
    foreach ($links as $href => $label) {
        $isActive = $currentPath === $href || ($href === '/admin/items.php' && $currentPath === '/admin/item_review.php');
        $className = 'nav-link admin-nav-link' . ($isActive ? ' active' : '');
        echo '<li class="nav-item"><a class="' . e($className) . '" href="' . e($href) . '">' . e($label) . '</a></li>';
    }
    echo '</ul><a class="btn admin-btn admin-btn--ghost btn-sm" href="/admin/logout.php">登出</a></div></div></nav>';
    echo '<main id="admin-main" class="container-fluid admin-main py-4">';
}

function admin_footer(): void
{
    echo '</main><script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script></body></html>';
}

function admin_page_header(string $eyebrow, string $title, string $description = '', string $actions = ''): void
{
    echo '<section class="admin-page-header mb-4">';
    echo '<div class="admin-page-header__content">';
    echo '<p class="admin-page-header__eyebrow mb-2">' . e($eyebrow) . '</p>';
    echo '<h1 class="admin-page-header__title h2 mb-2">' . e($title) . '</h1>';
    if ($description !== '') {
        echo '<p class="admin-page-header__description mb-0">' . e($description) . '</p>';
    }
    echo '</div>';
    if ($actions !== '') {
        echo '<div class="admin-page-header__actions">' . $actions . '</div>';
    }
    echo '</section>';
}

function admin_status_badge(string $status, string $context = 'generic'): string
{
    $genericLabels = [
        'active' => '啟用',
        'reserved' => '預約中',
        'removed' => '已下架',
        'violation_removed' => '違規下架',
        'deleted' => '已刪除',
        'pending' => '待處理',
        'accepted' => '已同意',
        'completed' => '已完成',
        'failed' => '失敗',
        'cancelled' => '已取消',
        'rejected' => '已拒絕',
        'frozen' => '已凍結',
    ];

    $contextLabels = [
        'item' => [
            'active' => '上架中',
        ],
        'member' => [
            'active' => '啟用',
        ],
    ];

    $classes = [
        'active' => 'admin-badge admin-badge--success',
        'reserved' => 'admin-badge admin-badge--warning',
        'removed' => 'admin-badge admin-badge--neutral',
        'violation_removed' => 'admin-badge admin-badge--danger',
        'deleted' => 'admin-badge admin-badge--neutral',
        'pending' => 'admin-badge admin-badge--info',
        'accepted' => 'admin-badge admin-badge--success',
        'completed' => 'admin-badge admin-badge--brand',
        'failed' => 'admin-badge admin-badge--danger',
        'cancelled' => 'admin-badge admin-badge--neutral',
        'rejected' => 'admin-badge admin-badge--danger',
        'frozen' => 'admin-badge admin-badge--warning',
    ];

    $label = $contextLabels[$context][$status] ?? $genericLabels[$status] ?? $status;
    $className = $classes[$status] ?? 'admin-badge admin-badge--neutral';

    return '<span class="' . e($className) . '"><span aria-hidden="true" class="admin-badge__dot"></span>' . e($label) . '</span>';
}
