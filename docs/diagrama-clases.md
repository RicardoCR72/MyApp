# Diagrama sencillo de clases

El siguiente diagrama representa las clases e interfaces principales implementadas en la aplicación. Las páginas consumen servicios; los servicios envían las solicitudes HTTP a la API PHP y transforman las respuestas en interfaces TypeScript.

```mermaid
classDiagram
    class LoginPage {
        +username: string
        +password: string
        +login(): Promise~void~
    }

    class Tab1Page {
        +currentUser: AuthUser
        +logout(): void
    }

    class Tab2Page {
        +users: UserRecord[]
        +loadUsers(): Promise~void~
        +saveUser(): Promise~void~
        +deleteUser(user): Promise~void~
    }

    class Tab3Page {
        +selectedSport: OracleSport
        +predictions: OraclePrediction[]
        +loadPredictions(): Promise~void~
    }

    class AuthService {
        +login(credentials): Promise~LoginResponse~
        +logout(): void
        +getToken(): string
        +getCurrentUser(): AuthUser
        +isAuthenticated(): boolean
    }

    class UserService {
        +list(): Promise~UserRecord[]~
        +create(input): Promise~UserRecord~
        +patch(id, input): Promise~UserRecord~
        +remove(id): Promise~DeleteResponse~
    }

    class OracleService {
        +getPredictions(sport, filters): Promise~OraclePrediction[]~
    }

    class AuthUser {
        <<interface>>
        +id: number
        +username: string
        +email: string
        +fullName: string
        +role: string
    }

    class UserRecord {
        <<interface>>
        +id: number
        +username: string
        +email: string
        +fullName: string
        +role: UserRole
        +status: UserStatus
    }

    class OraclePrediction {
        <<interface>>
        +sport: OracleSport
        +marketType: string
        +line: number
        +selection: string
        +probability: number
        +edge: number
        +pickStatus: string
    }

    LoginPage --> AuthService : autentica
    Tab1Page --> AuthService : consulta sesión
    Tab2Page --> UserService : administra
    Tab3Page --> AuthService : personaliza
    Tab3Page --> OracleService : consulta
    AuthService ..> AuthUser : utiliza
    UserService ..> UserRecord : utiliza
    OracleService ..> OraclePrediction : utiliza
```

## Responsabilidades

- `AuthService`: realiza el inicio de sesión, persiste el token y controla el estado de autenticación.
- `UserService`: encapsula las llamadas Axios al endpoint `users.php`.
- `OracleService`: consulta con Axios las predicciones MLB y NFL de `predictions.php`.
- `Tab2Page`: administra el estado del formulario y presenta las operaciones CRUD.
- `AuthUser` y `UserRecord`: establecen contratos tipados entre la interfaz, los servicios y la API.
