<?php
declare(strict_types=1);

function env_value(string $key, string $default = ''): string
{
    static $loaded = false;

    if (!$loaded) {
        $envPath = dirname(__DIR__, 2) . '/.env';
        if (is_readable($envPath)) {
            foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                    continue;
                }
                [$name, $value] = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                $value = trim($value, "\"'");
                if ($name !== '' && getenv($name) === false) {
                    putenv($name . '=' . $value);
                    $_ENV[$name] = $value;
                }
            }
        }
        $loaded = true;
    }

    $value = getenv($key);
    return $value === false ? $default : $value;
}

define('DB_HOST', env_value('DB_HOST', '127.0.0.1'));
define('DB_PORT', env_value('DB_PORT', '3306'));
define('DB_NAME', env_value('DB_NAME', 'campus_share'));
define('DB_USER', env_value('DB_USER', 'root'));
define('DB_PASS', env_value('DB_PASS', ''));
define('ADMIN_SESSION_NAME', env_value('ADMIN_SESSION_NAME', 'CAMPUS_ADMIN_SESSID'));
