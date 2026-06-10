<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

function get_dashboard_snapshot(): array
{
    return [
        'stats' => get_dashboard_stats(),
        'categoryRows' => get_dashboard_category_rows(),
        'monthRows' => get_dashboard_month_rows(),
        'appointmentStatusRows' => get_dashboard_appointment_status_rows(),
        'exchangeModeRows' => get_dashboard_exchange_mode_rows(),
        'itemMonthRows' => get_dashboard_item_month_rows(),
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

function get_dashboard_appointment_status_rows(): array
{
    return db()->query(
        "SELECT status, COUNT(*) AS total
         FROM appointments
         GROUP BY status"
    )->fetchAll();
}

function get_dashboard_exchange_mode_rows(): array
{
    return db()->query(
        "SELECT exchange_mode, COUNT(*) AS total
         FROM items
         GROUP BY exchange_mode"
    )->fetchAll();
}

function get_dashboard_item_month_rows(): array
{
    return db()->query(
        "SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS total
         FROM items
         GROUP BY DATE_FORMAT(created_at, '%Y-%m')
         ORDER BY month
         LIMIT 6"
    )->fetchAll();
}
