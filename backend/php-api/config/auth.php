<?php
declare(strict_types=1);

function apiAuthorizationHeader(): string
{
    $header = trim((string) ($_SERVER['HTTP_AUTHORIZATION'] ?? ''));
    if ($header !== '') {
        return $header;
    }

    if (function_exists('apache_request_headers')) {
        foreach (apache_request_headers() as $name => $value) {
            if (strcasecmp((string) $name, 'Authorization') === 0) {
                return trim((string) $value);
            }
        }
    }

    return '';
}

function apiAuthenticatedUser(PDO $database, bool $administratorOnly = false): array
{
    $authorization = apiAuthorizationHeader();
    if (!preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
        apiRespond(401, ['success' => false, 'message' => 'Token de acceso requerido.']);
    }

    $token = trim($matches[1]);
    $statement = $database->prepare(
        'SELECT u.id, u.username, u.role, u.status
         FROM auth_tokens AS t
         INNER JOIN users AS u ON u.id = t.user_id
         WHERE t.token_hash = :token_hash
           AND t.revoked_at IS NULL
           AND t.expires_at > NOW()
         LIMIT 1'
    );
    $statement->execute(['token_hash' => hash('sha256', $token)]);
    $user = $statement->fetch();

    if (!$user || $user['status'] !== 'active') {
        apiRespond(401, ['success' => false, 'message' => 'El token es invalido o ha expirado.']);
    }

    if ($administratorOnly && $user['role'] !== 'admin') {
        apiRespond(403, ['success' => false, 'message' => 'Se requieren permisos de administrador.']);
    }

    return $user;
}

