# Persistencia con Capacitor Preferences

## Objetivo

Evitar que la sesión desaparezca al cerrar o recargar la aplicación. Los usuarios del CRUD permanecen en MySQL y la sesión del dispositivo se conserva con `@capacitor/preferences`.

## Información almacenada

| Clave | Contenido |
|---|---|
| `auth_token` | Token emitido por `login.php`. |
| `auth_user` | Usuario autenticado serializado como JSON. |
| `auth_expires_at` | Fecha de expiración de la sesión. |

Las contraseñas nunca se guardan en Preferences.

## Instalación y sincronización

```bash
npm install
npx cap sync
ionic serve
```

## Funcionamiento

1. `login()` valida las credenciales mediante Axios.
2. La respuesta correcta se guarda con `Preferences.set()`.
3. `provideAppInitializer` ejecuta `AuthService.initialize()` cuando se abre la aplicación.
4. El servicio recupera los valores con `Preferences.get()`.
5. `AuthGuard` permite la entrada solamente si existe una sesión vigente.
6. `logout()` borra los tres valores con `Preferences.remove()`.

## Guion sugerido para el video

1. Encender Apache y MySQL en XAMPP.
2. Ejecutar `ionic serve`.
3. Iniciar sesión como administrador.
4. Entrar a **Usuarios**, crear un usuario y mostrarlo en la lista.
5. Cerrar la pestaña o la aplicación sin utilizar **Cerrar sesión**.
6. Abrir nuevamente `http://localhost:8100`.
7. Mostrar que la aplicación entra a las pestañas sin solicitar de nuevo las credenciales.
8. En **Mi sesión**, mostrar el aviso **Persistencia verificada**.
9. Entrar a **Usuarios** y mostrar que el usuario creado continúa almacenado.
10. Modificar el usuario y recargar la página para demostrar que el cambio permanece.
11. Eliminar el usuario y recargar para demostrar que no reaparece.
12. Pulsar **Cerrar sesión** y comprobar que se regresa al login.

## Evidencia para la rúbrica

- Alta: `POST /users.php`.
- Consulta: `GET /users.php`.
- Modificación: `PATCH /users.php?id=ID`.
- Eliminación: `DELETE /users.php?id=ID`.
- Persistencia del CRUD: MySQL/MariaDB.
- Persistencia de sesión: Capacitor Preferences.
- Eliminación de sesión: `Preferences.remove()`.
