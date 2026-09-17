<?php
declare(strict_types=1);

/**
 * API REST de usuarios para MiApp.
 *
 * Rutas (el id se envía como query string):
 *   GET    /users.php             Lista usuarios
 *   GET    /users.php?id=1        Obtiene un usuario
 *   POST   /users.php             Crea un usuario
 *   PUT    /users.php?id=1        Reemplaza los datos de un usuario
 *   PATCH  /users.php?id=1        Actualiza uno o varios campos
 *   DELETE /users.php?id=1        Elimina un usuario
 *   OPTIONS /users.php            Preflight de CORS
 *
 * Todos los métodos, excepto OPTIONS, requieren el token obtenido en
 * login.php mediante el encabezado: Authorization: Bearer <token>
 */

require_once __DIR__ . '/config/database.php';

// En producción puede limitarse el origen configurando MIAPP_CORS_ORIGIN.
$corsOrigin = getenv('MIAPP_CORS_ORIGIN') ?: '*';
header('Access-Control-Allow-Origin: ' . $corsOrigin);
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function readJsonBody(bool $required = true): array
{
    $rawBody = file_get_contents('php://input') ?: '';

    if ($rawBody === '') {
        if ($required) {
            respond(400, ['success' => false, 'message' => 'El cuerpo JSON es obligatorio.']);
        }
        return [];
    }

    $body = json_decode($rawBody, true);
    if (!is_array($body) || json_last_error() !== JSON_ERROR_NONE) {
        respond(400, ['success' => false, 'message' => 'El cuerpo debe contener JSON válido.']);
    }

    return $body;
}

function requestAuthorizationHeader(): string
{
    $header = trim((string) ($_SERVER['HTTP_AUTHORIZATION'] ?? ''));
    if ($header !== '') {
        return $header;
    }

    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        foreach ($headers as $name => $value) {
            if (strcasecmp((string) $name, 'Authorization') === 0) {
                return trim((string) $value);
            }
        }
    }

    return '';
}

function requireAdministrator(PDO $database): array
{
    $authorization = requestAuthorizationHeader();
    if (!preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
        respond(401, ['success' => false, 'message' => 'Token de acceso requerido.']);
    }

    $token = trim($matches[1]);
    if ($token === '') {
        respond(401, ['success' => false, 'message' => 'Token de acceso inválido.']);
    }

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
    $authenticatedUser = $statement->fetch();

    if (!$authenticatedUser || $authenticatedUser['status'] !== 'active') {
        respond(401, ['success' => false, 'message' => 'El token es inválido o ha expirado.']);
    }

    if ($authenticatedUser['role'] !== 'admin') {
        respond(403, ['success' => false, 'message' => 'Se requieren permisos de administrador.']);
    }

    return $authenticatedUser;
}

function requestUserId(array $body = []): int
{
    $rawId = $_GET['id'] ?? $body['id'] ?? null;
    if (!is_scalar($rawId) || filter_var($rawId, FILTER_VALIDATE_INT) === false || (int) $rawId < 1) {
        respond(400, ['success' => false, 'message' => 'Se requiere un id de usuario válido.']);
    }

    return (int) $rawId;
}

function publicUser(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'username' => (string) $row['username'],
        'email' => (string) $row['email'],
        'fullName' => (string) $row['full_name'],
        'role' => (string) $row['role'],
        'status' => (string) $row['status'],
        'lastLoginAt' => $row['last_login_at'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}

function findUser(PDO $database, int $id): ?array
{
    $statement = $database->prepare(
        'SELECT id, username, email, full_name, role, status,
                last_login_at, created_at, updated_at
         FROM users
         WHERE id = :id
         LIMIT 1'
    );
    $statement->execute(['id' => $id]);
    $row = $statement->fetch();

    return $row ?: null;
}

function textField(array $body, string $camelName, ?string $snakeName = null): ?string
{
    if (array_key_exists($camelName, $body)) {
        return trim((string) $body[$camelName]);
    }
    if ($snakeName !== null && array_key_exists($snakeName, $body)) {
        return trim((string) $body[$snakeName]);
    }
    return null;
}

function validateUsername(string $username): void
{
    if (!preg_match('/^[A-Za-z0-9._-]{3,50}$/', $username)) {
        respond(422, [
            'success' => false,
            'message' => 'El usuario debe tener entre 3 y 50 caracteres y solo usar letras, números, punto, guión o guión bajo.',
        ]);
    }
}

function validateEmail(string $email): void
{
    if (strlen($email) > 150 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        respond(422, ['success' => false, 'message' => 'El correo electrónico no es válido.']);
    }
}

function validateFullName(string $fullName): void
{
    if ($fullName === '' || strlen($fullName) > 150) {
        respond(422, ['success' => false, 'message' => 'El nombre completo es obligatorio y admite hasta 150 caracteres.']);
    }
}

function validatePassword(string $password): void
{
    if (strlen($password) < 8 || strlen($password) > 72) {
        respond(422, ['success' => false, 'message' => 'La contraseña debe tener entre 8 y 72 caracteres.']);
    }
}

function validateRole(string $role): void
{
    if (!in_array($role, ['admin', 'user'], true)) {
        respond(422, ['success' => false, 'message' => 'El rol debe ser admin o user.']);
    }
}

function validateStatus(string $status): void
{
    if (!in_array($status, ['active', 'inactive', 'blocked'], true)) {
        respond(422, ['success' => false, 'message' => 'El estado debe ser active, inactive o blocked.']);
    }
}

function duplicateEntryResponse(PDOException $error): never
{
    if ($error->getCode() === '23000') {
        respond(409, ['success' => false, 'message' => 'El nombre de usuario o correo ya está registrado.']);
    }

    throw $error;
}

try {
    $database = databaseConnection();
    requireAdministrator($database);

    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                $id = requestUserId();
                $user = findUser($database, $id);
                if ($user === null) {
                    respond(404, ['success' => false, 'message' => 'Usuario no encontrado.']);
                }

                respond(200, ['success' => true, 'data' => publicUser($user)]);
            }

            $statement = $database->query(
                'SELECT id, username, email, full_name, role, status,
                        last_login_at, created_at, updated_at
                 FROM users
                 ORDER BY id ASC'
            );
            $users = array_map('publicUser', $statement->fetchAll());
            respond(200, ['success' => true, 'count' => count($users), 'data' => $users]);

        case 'POST':
            $body = readJsonBody();
            $username = textField($body, 'username');
            $email = textField($body, 'email');
            $password = textField($body, 'password');
            $fullName = textField($body, 'fullName', 'full_name');
            $role = textField($body, 'role') ?? 'user';
            $status = textField($body, 'status') ?? 'active';

            if ($username === null || $email === null || $password === null || $fullName === null) {
                respond(422, [
                    'success' => false,
                    'message' => 'username, email, password y fullName son obligatorios.',
                ]);
            }

            validateUsername($username);
            validateEmail($email);
            validatePassword($password);
            validateFullName($fullName);
            validateRole($role);
            validateStatus($status);

            try {
                $statement = $database->prepare(
                    'INSERT INTO users
                        (username, email, password_hash, full_name, role, status)
                     VALUES
                        (:username, :email, :password_hash, :full_name, :role, :status)'
                );
                $statement->execute([
                    'username' => $username,
                    'email' => $email,
                    'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                    'full_name' => $fullName,
                    'role' => $role,
                    'status' => $status,
                ]);
            } catch (PDOException $error) {
                duplicateEntryResponse($error);
            }

            $createdUser = findUser($database, (int) $database->lastInsertId());
            respond(201, [
                'success' => true,
                'message' => 'Usuario creado correctamente.',
                'data' => publicUser($createdUser),
            ]);

        case 'PUT':
        case 'PATCH':
            $body = readJsonBody();
            $id = requestUserId($body);
            if (findUser($database, $id) === null) {
                respond(404, ['success' => false, 'message' => 'Usuario no encontrado.']);
            }

            $isPut = $method === 'PUT';
            $updates = [];
            $parameters = ['id' => $id];

            $username = textField($body, 'username');
            $email = textField($body, 'email');
            $password = textField($body, 'password');
            $fullName = textField($body, 'fullName', 'full_name');
            $role = textField($body, 'role');
            $status = textField($body, 'status');

            if ($isPut && ($username === null || $email === null || $fullName === null || $role === null || $status === null)) {
                respond(422, [
                    'success' => false,
                    'message' => 'PUT requiere username, email, fullName, role y status. password es opcional.',
                ]);
            }

            if ($username !== null) {
                validateUsername($username);
                $updates[] = 'username = :username';
                $parameters['username'] = $username;
            }
            if ($email !== null) {
                validateEmail($email);
                $updates[] = 'email = :email';
                $parameters['email'] = $email;
            }
            if ($password !== null) {
                validatePassword($password);
                $updates[] = 'password_hash = :password_hash';
                $parameters['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
            }
            if ($fullName !== null) {
                validateFullName($fullName);
                $updates[] = 'full_name = :full_name';
                $parameters['full_name'] = $fullName;
            }
            if ($role !== null) {
                validateRole($role);
                $updates[] = 'role = :role';
                $parameters['role'] = $role;
            }
            if ($status !== null) {
                validateStatus($status);
                $updates[] = 'status = :status';
                $parameters['status'] = $status;
            }

            if ($updates === []) {
                respond(422, ['success' => false, 'message' => 'No se proporcionaron campos para actualizar.']);
            }

            try {
                $statement = $database->prepare(
                    'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = :id'
                );
                $statement->execute($parameters);
            } catch (PDOException $error) {
                duplicateEntryResponse($error);
            }

            // Si el usuario queda inactivo o bloqueado, se revocan sus tokens activos.
            if ($status === 'inactive' || $status === 'blocked') {
                $revoke = $database->prepare(
                    'UPDATE auth_tokens SET revoked_at = NOW()
                     WHERE user_id = :user_id AND revoked_at IS NULL'
                );
                $revoke->execute(['user_id' => $id]);
            }

            respond(200, [
                'success' => true,
                'message' => $method === 'PATCH'
                    ? 'Usuario actualizado parcialmente.'
                    : 'Usuario reemplazado correctamente.',
                'data' => publicUser(findUser($database, $id)),
            ]);

        case 'DELETE':
            $body = readJsonBody(false);
            $id = requestUserId($body);
            if (findUser($database, $id) === null) {
                respond(404, ['success' => false, 'message' => 'Usuario no encontrado.']);
            }

            $statement = $database->prepare('DELETE FROM users WHERE id = :id');
            $statement->execute(['id' => $id]);
            respond(200, ['success' => true, 'message' => 'Usuario eliminado correctamente.']);

        default:
            header('Allow: GET, POST, PUT, PATCH, DELETE, OPTIONS');
            respond(405, ['success' => false, 'message' => 'Método HTTP no permitido.']);
    }
} catch (Throwable $error) {
    error_log($error->getMessage());
    respond(500, ['success' => false, 'message' => 'Ocurrió un error interno en la API.']);
}
