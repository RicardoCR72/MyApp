<?php
declare(strict_types=1);

function databaseConnection(): PDO
{
    $host = getenv('MIAPP_DB_HOST') ?: '127.0.0.1';
    $port = getenv('MIAPP_DB_PORT') ?: '3306';
    $database = getenv('MIAPP_DB_NAME') ?: 'miapp_auth';
    $username = getenv('MIAPP_DB_USER') ?: 'root';
    $password = getenv('MIAPP_DB_PASSWORD') ?: '';
    $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";

    return new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}
