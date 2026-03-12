<?php
/**
 * ArcReady AI Proxy — ai-proxy.php
 * Routes requests to OpenRouter, adds rate limiting and key security.
 * Deploy to Hostinger root with OPENROUTER_KEY set below.
 */

header('Content-Type: application/json');
// BUG 11 FIX: restrict CORS to specific origin instead of wildcard '*'
$allowed_origins = ['https://arcready.net', 'http://localhost', 'http://127.0.0.1'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: https://arcready.net');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { http_response_code(405); die('{"error":"Method not allowed"}'); }

// ── Config ────────────────────────────────────────────────────
// Attempt to load .env if it exists (for local development)
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . '=' . trim($value));
    }
}

$OPENROUTER_KEY = getenv('OPENROUTER_KEY') ?: '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';
$RATE_LIMIT     = 30;   // max requests per hour per IP
$RATE_WINDOW    = 3600; // seconds
$TMP_DIR        = sys_get_temp_dir();

// ── Rate Limiting (IP-based via temp files) ───────────────────
$ip       = preg_replace('/[^0-9a-fA-F:.]/', '', $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
$rateFile = $TMP_DIR . '/arcready_rl_' . md5($ip) . '.json';

$rateData = ['count' => 0, 'window_start' => time()];
if (file_exists($rateFile)) {
    $raw = @json_decode(file_get_contents($rateFile), true);
    if ($raw && (time() - $raw['window_start']) < $RATE_WINDOW) {
        $rateData = $raw;
    }
}
if ($rateData['count'] >= $RATE_LIMIT) {
    http_response_code(429);
    die(json_encode(['error' => 'Rate limit exceeded. Please try again later.']));
}
$rateData['count']++;
@file_put_contents($rateFile, json_encode($rateData), LOCK_EX);

// ── Validate request body ─────────────────────────────────────
$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!$body || !isset($body['model'], $body['messages']) || !is_array($body['messages'])) {
    http_response_code(400);
    die('{"error":"Bad request: missing model or messages"}');
}

// ── Allowlist of permitted models ─────────────────────────────
$allowed_models = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'google/gemini-flash-1.5',
    'google/gemini-2.0-flash-001',
    'anthropic/claude-haiku',
    'openai/gpt-4o-mini',
];
if (!in_array($body['model'], $allowed_models)) {
    http_response_code(400);
    die('{"error":"Model not permitted"}');
}

// ── Forward to OpenRouter ─────────────────────────────────────
$ch = curl_init('https://openrouter.ai/api/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 25,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . $OPENROUTER_KEY,
        'Content-Type: application/json',
        'HTTP-Referer: https://arcready.net',
        'X-Title: ArcReady Training',
    ],
    CURLOPT_POSTFIELDS     => json_encode($body),
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($curlErr) {
    http_response_code(502);
    die(json_encode(['error' => 'Gateway error: ' . $curlErr]));
}

http_response_code($httpCode);
echo $response;
