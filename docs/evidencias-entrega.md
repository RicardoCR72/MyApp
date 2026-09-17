# Evidencias de la entrega

| Requisito | Evidencia en el proyecto |
|---|---|
| Modelo de datos | `backend/php-api/database.sql` y `docs/modelo-datos.md` |
| Interfaces TypeScript | `src/app/services/auth.service.ts` y `src/app/services/user.service.ts` |
| Servicios para acceso a datos | `AuthService` y `UserService`, ambos con Axios |
| Operaciones CRUD básicas | `backend/php-api/users.php` y acciones de `Tab2Page` |
| Código fuente actualizado en Git | Repositorio local más los comandos documentados en `README.md` |
| Diagrama de clases o entidades | `docs/diagrama-clases.md` y diagrama ER de `docs/modelo-datos.md` |
| Documento de uso de IA | `docs/uso-ia.md` |

## Interfaces TypeScript implementadas

- `LoginCredentials`
- `AuthUser`
- `LoginResponse`
- `UserRecord`
- `CreateUserInput`
- `UpdateUserInput`
- `UserRole`
- `UserStatus`

## Correspondencia CRUD

| Operación | HTTP | Servicio TypeScript | API PHP |
|---|---|---|---|
| Crear | POST | `UserService.create()` | `users.php`, caso `POST` |
| Leer | GET | `UserService.list()` | `users.php`, caso `GET` |
| Actualizar | PATCH | `UserService.patch()` | `users.php`, caso `PATCH` |
| Reemplazar | PUT | Disponible en la API | `users.php`, caso `PUT` |
| Eliminar | DELETE | `UserService.remove()` | `users.php`, caso `DELETE` |

## Verificación recomendada antes de entregar

```bash
npm install
npm run lint
npm test -- --watch=false
npm run build
git status
```

