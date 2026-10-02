# Modelo inicial de datos

El Oráculo deportivo utiliza entidades de autenticación y entidades predictivas. La estructura física se encuentra en `backend/php-api/database.sql`.

```mermaid
erDiagram
    USERS ||--o{ AUTH_TOKENS : genera
    SPORTS_GAMES ||--o{ PREDICTIONS : contiene
    MODEL_RUNS ||--o{ PREDICTIONS : produce

    USERS {
        bigint id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar role
        enum status
        datetime last_login_at
        timestamp created_at
        timestamp updated_at
    }

    AUTH_TOKENS {
        bigint id PK
        bigint user_id FK
        char token_hash UK
        datetime expires_at
        datetime revoked_at
        varchar ip_address
        varchar user_agent
        timestamp created_at
    }

    SPORTS_GAMES {
        bigint id PK
        varchar external_game_id UK
        enum sport
        smallint season
        smallint week
        datetime game_date
        varchar away_team
        varchar home_team
    }

    MODEL_RUNS {
        bigint id PK
        enum sport
        varchar model_version
        enum status
        datetime started_at
        datetime finished_at
    }

    PREDICTIONS {
        bigint id PK
        bigint game_id FK
        bigint model_run_id FK
        varchar market_type
        decimal line_value
        varchar selection
        decimal probability
        decimal edge_value
        varchar pick_status
    }
```

## Entidad `users`

Almacena las cuentas que pueden entrar a la aplicación.

| Campo | Uso |
|---|---|
| `id` | Identificador interno |
| `username` | Nombre único utilizado para iniciar sesión |
| `email` | Correo único; también puede utilizarse para iniciar sesión |
| `password_hash` | Contraseña cifrada mediante `password_hash()` |
| `full_name` | Nombre mostrado en la aplicación |
| `role` | `admin` o `user` |
| `status` | `active`, `inactive` o `blocked` |
| `last_login_at` | Fecha del último acceso correcto |
| `created_at`, `updated_at` | Auditoría básica |

## Entidad `auth_tokens`

Registra las sesiones creadas al iniciar sesión. En la base únicamente se almacena el SHA-256 del token; el valor original se entrega al cliente una sola vez.

La relación es **uno a muchos**: un usuario puede tener varias sesiones. La llave foránea tiene `ON DELETE CASCADE`, por lo que al eliminar un usuario también se eliminan sus tokens.

## Entidades deportivas

- `sports_games` identifica partidos MLB y NFL sin duplicarlos.
- `predictions` almacena F5, totales NFL y props de jugadores bajo un contrato común.
- `model_runs` permite auditar versión, estado y cantidad de resultados de cada ejecución.

El campo `source_prediction_key` permite actualizar una predicción existente cuando el modelo vuelve a ejecutarse, evitando registros duplicados.
