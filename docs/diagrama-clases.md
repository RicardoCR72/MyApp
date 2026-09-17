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
        +markets: OracleMarket[]
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

    LoginPage --> AuthService : autentica
    Tab1Page --> AuthService : consulta sesión
    Tab2Page --> UserService : administra
    Tab3Page --> AuthService : personaliza
    AuthService ..> AuthUser : utiliza
    UserService ..> UserRecord : utiliza
```

## Responsabilidades

- `AuthService`: realiza el inicio de sesión, persiste el token y controla el estado de autenticación.
- `UserService`: encapsula las llamadas Axios al endpoint `users.php`.
- `Tab2Page`: administra el estado del formulario y presenta las operaciones CRUD.
- `AuthUser` y `UserRecord`: establecen contratos tipados entre la interfaz, los servicios y la API.

