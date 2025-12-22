<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$config = require __DIR__ . '/config.php';

function send_json($data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

function db(array $config): ?PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    try {
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_port'], $config['db_name']);
        $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
    } catch (Throwable $e) {
        return null;
    }

    return $pdo;
}

function slugify(): string
{
    return bin2hex(random_bytes(5));
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
$method = $_SERVER['REQUEST_METHOD'];

// Normaliza base /api
$path = preg_replace('#^/api#', '', $path);

if ($path === '/health') {
    send_json(['status' => 'ok', 'time' => date(DATE_ATOM)]);
}

if ($path === '/templates' && $method === 'GET') {
    $pdo = db($config);
    if ($pdo) {
        $stmt = $pdo->query('SELECT id, template_key, title, occasion, accent_color, gradient, description, features_json FROM templates ORDER BY id DESC');
        $rows = $stmt->fetchAll();
        $templates = array_map(function ($row) {
            return [
                'id' => $row['template_key'],
                'title' => $row['title'],
                'occasion' => $row['occasion'],
                'accent' => $row['accent_color'],
                'gradient' => $row['gradient'],
                'description' => $row['description'],
                'features' => json_decode($row['features_json'] ?: '[]', true)
            ];
        }, $rows);
        send_json(['templates' => $templates]);
    }

    // Respaldo estático si no hay base de datos
    send_json([
        'templates' => [
            [
                'id' => 'luz',
                'title' => 'Luz cálida',
                'occasion' => 'cumpleaños',
                'accent' => '#f97316',
                'gradient' => 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
                'description' => 'Globos suaves, tipografía redondeada y un titular con brillo.',
                'features' => ['Confeti animado', 'Botón de audio', 'Llamado a la acción']
            ],
            [
                'id' => 'aurora',
                'title' => 'Aurora',
                'occasion' => 'aniversario',
                'accent' => '#8b5cf6',
                'gradient' => 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                'description' => 'Bordes redondeados y destellos violetas para momentos especiales.',
                'features' => ['Sticker animado', 'Firma manuscrita', 'Botón de compartir']
            ],
            [
                'id' => 'verde',
                'title' => 'Hojas y luz',
                'occasion' => 'agradecimiento',
                'accent' => '#22c55e',
                'gradient' => 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                'description' => 'Trazos orgánicos, ideal para notas de agradecimiento o ánimo.',
                'features' => ['Botón de descarga', 'Etiquetas personalizadas', 'Modo responsivo']
            ]
        ]
    ]);
}

if ($path === '/cards' && $method === 'POST') {
    $body = json_decode(file_get_contents('php://input') ?: '{}', true);
    $pdo = db($config);

    $shareSlug = $body['share_slug'] ?? slugify();
    $accentColor = $body['accent_color'] ?? '#8b5cf6';
    $templateKey = $body['template_id'] ?? 'luz';

    if ($pdo) {
        $stmt = $pdo->prepare('INSERT INTO cards (template_id, share_slug, headline, message, recipient_name, sender_name, accent_color, sticker, include_audio) VALUES (:template_id, :share_slug, :headline, :message, :recipient_name, :sender_name, :accent_color, :sticker, :include_audio)');
        $stmt->execute([
            ':template_id' => $templateKey,
            ':share_slug' => $shareSlug,
            ':headline' => $body['headline'] ?? '',
            ':message' => $body['message'] ?? '',
            ':recipient_name' => $body['recipient_name'] ?? '',
            ':sender_name' => $body['sender_name'] ?? '',
            ':accent_color' => $accentColor,
            ':sticker' => $body['sticker'] ?? '🎉',
            ':include_audio' => !empty($body['include_audio']) ? 1 : 0
        ]);
    }

    $shareUrl = rtrim($config['app_url'], '/') . '/cards/' . $shareSlug;

    send_json([
        'slug' => $shareSlug,
        'share_slug' => $shareSlug,
        'share_url' => $shareUrl,
        'message' => 'Tarjeta guardada correctamente.'
    ], 201);
}

if (preg_match('#^/cards/([a-zA-Z0-9_-]+)$#', $path, $matches) && $method === 'GET') {
    $slug = $matches[1];
    $pdo = db($config);
    $card = null;

    if ($pdo) {
        $stmt = $pdo->prepare('SELECT c.share_slug, c.headline, c.message, c.recipient_name, c.sender_name, c.accent_color, c.sticker, c.include_audio, t.title AS template_title, t.occasion AS template_occasion, t.accent_color AS template_accent, t.gradient AS template_gradient FROM cards c LEFT JOIN templates t ON c.template_id = t.template_key WHERE c.share_slug = :slug LIMIT 1');
        $stmt->execute([':slug' => $slug]);
        $card = $stmt->fetch();
    }

    if (!$card) {
        send_json(['error' => 'No se encontró la tarjeta solicitada.'], 404);
    }

    send_json(['card' => $card]);
}

send_json(['error' => 'Ruta no encontrada', 'path' => $path], 404);
