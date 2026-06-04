<?php
declare(strict_types=1);

require_once __DIR__ . '/security.php';

function admin_header(string $title): void
{
    echo '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">';
    echo '<meta name="viewport" content="width=device-width, initial-scale=1">';
    echo '<title>' . e($title) . ' - 校園共享後台</title>';
    echo '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">';
    echo '<link href="/admin/assets/admin.css" rel="stylesheet">';
    echo '</head><body>';
    echo '<a class="skip-link" href="#admin-main">跳到主要內容</a>';
    echo '<nav class="navbar navbar-expand-lg bg-dark navbar-dark"><div class="container-fluid">';
    echo '<a class="navbar-brand fw-bold" href="/admin/index.php">校園共享後台</a>';
    echo '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNav" aria-controls="adminNav" aria-expanded="false" aria-label="切換導覽"><span class="navbar-toggler-icon"></span></button>';
    echo '<div class="collapse navbar-collapse" id="adminNav"><ul class="navbar-nav me-auto">';
    $links = [
        '/admin/index.php' => 'Dashboard',
        '/admin/members.php' => '會員管理',
        '/admin/items.php' => '物品審查',
        '/admin/logs.php' => '操作紀錄',
    ];
    foreach ($links as $href => $label) {
        echo '<li class="nav-item"><a class="nav-link" href="' . e($href) . '">' . e($label) . '</a></li>';
    }
    echo '</ul><a class="btn btn-outline-light btn-sm" href="/admin/logout.php">登出</a></div></div></nav>';
    echo '<main id="admin-main" class="container-fluid py-4">';
}

function admin_footer(): void
{
    echo '</main><script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script></body></html>';
}
