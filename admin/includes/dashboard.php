<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

function get_dashboard_snapshot(): array
{
    return [
        'stats' => get_dashboard_stats(),
        'categoryRows' => get_dashboard_category_rows(),
        'monthRows' => get_dashboard_month_rows(),
    ];
}

function get_dashboard_stats(): array
{
    return [
        'members' => (int) db()->query("SELECT COUNT(*) FROM students WHERE status <> 'deleted'")->fetchColumn(),
        'frozen' => (int) db()->query("SELECT COUNT(*) FROM students WHERE status = 'frozen'")->fetchColumn(),
        'active_items' => (int) db()->query("SELECT COUNT(*) FROM items WHERE status = 'active'")->fetchColumn(),
        'completed' => (int) db()->query("SELECT COUNT(*) FROM appointments WHERE status = 'completed'")->fetchColumn(),
    ];
}

function get_dashboard_category_rows(): array
{
    return db()->query(
        "SELECT c.name, COUNT(i.id) AS total
         FROM categories c
         LEFT JOIN items i ON i.category_id = c.id
         GROUP BY c.id, c.name
         ORDER BY c.sort_order"
    )->fetchAll();
}

function get_dashboard_month_rows(): array
{
    return db()->query(
        "SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS total
         FROM students
         GROUP BY DATE_FORMAT(created_at, '%Y-%m')
         ORDER BY month
         LIMIT 6"
    )->fetchAll();
}
