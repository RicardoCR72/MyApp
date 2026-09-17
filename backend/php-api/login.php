<?php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/models/User.php';

$allowedOrigins = [
    'http://localhost:8100',
    'http://127.0.0.1:8100',
    'http://localhost',
    'https://localhost',
    'capacitor://localhost',
    'ionic://localhost',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['success' => false, 'message' => 'Método no permitido.']);
}

$body = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($body)) {
    respond(400, ['success' => false, 'message' => 'El cuerpo debe ser JSON válido.']);
}

$identifier = trim((string) ($body['username'] ?? ''));
$password = (string) ($body['password'] ?? '');
if ($identifier === '' || $password === '') {
    respond(422, ['success' => false, 'message' => 'El usuario y la contraseña son obligatorios.']);
}

try {
    $database = databaseConnection();
    $user = User::findByIdentifier($database, $identifier);

    if ($user === null || $user->status !== 'active' || !password_verify($password, $user->passwordHash)) {
        respond(401, ['success' => false, 'message' => 'Usuario o contraseña incorrectos.']);
    }

    $token = bin2hex(random_bytes(32));
    $expiresAt = new DateTimeImmutable('+8 hours');
    $database->beginTransaction();

    $update = $database->prepare('UPDATE users SET last_login_at = NOW() WHERE id = :user_id');
    $update->execute(['user_id' => $user->id]);

    $insert = $database->prepare(
        'INSERT INTO auth_tokens
          (user_id, token_hash, expires_at, ip_address, user_agent)
         VALUES
          (:user_id, :token_hash, :expires_at, :ip_address, :user_agent)'
    );
    $insert->execute([
        'user_id' => $user->id,
        'token_hash' => hash('sha256', $token),
        'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
        'ip_address' => substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45),
        'user_agent' => substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
    ]);
    $database->commit();

    respond(200, [
        'success' => true,
        'message' => 'Inicio de sesión correcto.',
        'token' => $token,
        'expiresAt' => $expiresAt->format(DATE_ATOM),
        'user' => $user->toPublicArray(),
    ]);
} catch (Throwable $error) {
    if (isset($database) && $database instanceof PDO && $database->inTransaction()) {
        $database->rollBack();
    }
    error_log($error->getMessage());
    respond(500, ['success' => false, 'message' => 'No fue posible procesar el inicio de sesión.']);
}
