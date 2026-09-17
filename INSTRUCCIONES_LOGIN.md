# Instalación del login

## Contenido

- Vista migrada de `Tab1Page` a `LoginPage`.
- Ruta inicial `/login`.
- Ruta protegida `/tabs`; al autenticar navega a `/tabs/tab1`.
- Cliente Axios en `src/app/services/auth.service.ts`.
- API PHP/MySQL en `backend/php-api`.
- SQL, primera carga, modelo `User` y objetos JSON de ejemplo.

## XAMPP

1. Copia `backend/php-api` a `C:\xampp\htdocs\miapp-api`.
2. Inicia Apache y MySQL.
3. Importa `backend/php-api/database.sql` desde phpMyAdmin.
4. Desde la carpeta del proyecto ejecuta:

```powershell
npm install
ionic serve
```

Accede a `http://localhost:8100/login`.

## Usuario inicial

```text
Usuario: admin
Correo: admin@miapp.local
Contraseña: password
```

La contraseña está almacenada con bcrypt; cámbiala antes de publicar.

## Configuración

La conexión MySQL está en `backend/php-api/config/database.php` y usa por
defecto `127.0.0.1`, base `miapp_auth`, usuario `root` y contraseña vacía.

Angular usa `http://localhost/miapp-api`, configurable en:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

En un teléfono físico cambia `localhost` por la IP local de la computadora.

Los ejemplos se encuentran en:

- `backend/php-api/examples/login-request.json`
- `backend/php-api/examples/initial-user-object.json`
