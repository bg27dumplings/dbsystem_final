<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

function log_admin_action(int $adminId, string $action, string $targetType, int $targetId, array $metadata = []): void
{
    $stmt = db()->prepare(
        'INSERT INTO admin_logs (admin_id, action, target_type, target_id, metadata_json, ip_address, user_agent)
         VALUES (:admin_id, :action, :target_type, :target_id, :metadata_json, :ip_address, :user_agent)'
    );
    $stmt->execute([
        'admin_id' => $adminId,
        'action' => $action,
        'target_type' => $targetType,
        'target_id' => $targetId,
        'metadata_json' => json_encode($metadata, JSON_UNESCAPED_UNICODE),
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
        'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
    ]);
}
