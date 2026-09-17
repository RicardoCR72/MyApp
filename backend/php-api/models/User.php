<?php
declare(strict_types=1);

final class User
{
    public function __construct(
        public readonly int $id,
        public readonly string $username,
        public readonly string $email,
        public readonly string $passwordHash,
        public readonly string $fullName,
        public readonly string $role,
        public readonly string $status
    ) {}

    public static function findByIdentifier(PDO $database, string $identifier): ?self
    {
        $statement = $database->prepare(
            'SELECT id, username, email, password_hash, full_name, role, status
             FROM users WHERE username = :username OR email = :email LIMIT 1'
        );
        $statement->execute(['username' => $identifier, 'email' => $identifier]);
        $row = $statement->fetch();
        if (!$row) return null;

        return new self(
            (int) $row['id'],
            (string) $row['username'],
            (string) $row['email'],
            (string) $row['password_hash'],
            (string) $row['full_name'],
            (string) $row['role'],
            (string) $row['status']
        );
    }

    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'email' => $this->email,
            'fullName' => $this->fullName,
            'role' => $this->role,
        ];
    }
}
