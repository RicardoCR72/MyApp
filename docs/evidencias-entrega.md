# Evidencias de la entrega

| Requisito | Evidencia en el proyecto |
|---|---|
| Modelo de datos JSON | `src/app/models/` (`auth.model.ts`, `user.model.ts`, `oracle.model.ts`, `data-source.model.ts`, `api-response.model.ts`) |
| Cliente móvil REST | `capacitor.config.ts`, `src/app/services/connection.service.ts` |
| Petición GET | `UserService.list()` y `OracleService.getPredictions()` |
| Petición POST | `AuthService.login()` y `UserService.create()` |
| Petición PUT | `UserService.update()` (`users.php?id=...`, reemplazo completo) |
| Petición PATCH | `UserService.patch()` (`users.php?id=...`, actualización parcial) |
| Petición DELETE | `UserService.remove()` (`users.php?id=...`, eliminación) |
| Servicios Angular | `ApiClientService`, `UserService`, `AuthService`, `OracleService`, `ConnectionService`, `SyncService` |
| Manejo de respuestas y errores | `ApiDiagnosticService`, `ApiErrorModalService`, feedback de éxito y error en vistas |
| Loading durante solicitudes | `LoadingController` de Ionic (`presentLoading()`) y `<ion-spinner>` en listas |
| Persistencia local | `@capacitor/preferences`, `CacheService` (`offline_cache_users`, `offline_cache_predictions_*`) |
| Consulta remota | Endpoints REST en PHP/MySQL consumidos por `UserService` y `OracleService` |
| Sincronización de información | `SyncService.syncRemoteData()`, actualización automática de caché tras consultas remotas |
| Manejo de pérdida de Internet | Evento `offline`, fallback a caché local con indicador temporal `savedAt` |
| Recuperación de conexión | Evento `online`, re-sincronización automática con la API y recarga de datos |
| Identificación visual de estado | Banner interactivo en `TabsPage`, badges reactivos y feedback visual en `Tab2Page` y `Tab3Page` |
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
- `DataSourceConfig`
- `ApiResponse<T>` y `ApiErrorResponse`

## Correspondencia de Operaciones REST

| Operación | Método HTTP | Servicio TypeScript | Vista / Componente | Loading / Feedback |
|---|---|---|---|---|
| Consultar lista | GET | `UserService.list()` | `Tab2Page.loadUsers()` | `<ion-spinner>` y refresher |
| Consultar filtros | GET | `OracleService.getPredictions()` | `Tab3Page.loadPredictions()` | `<ion-spinner>` y refresher |
| Autenticar | POST | `AuthService.login()` | `LoginPage.login()` | Animación de carga y diagnóstico |
| Crear usuario | POST | `UserService.create()` | `Tab2Page.saveUser()` | `LoadingController` ('Creando... (POST)') |
| Reemplazar usuario | PUT | `UserService.update()` | `Tab2Page.saveUser()` | `LoadingController` ('Reemplazando... (PUT)') |
| Modificar campos | PATCH | `UserService.patch()` | `Tab2Page.saveUser()` | `LoadingController` ('Actualizando... (PATCH)') |
| Eliminar usuario | DELETE | `UserService.remove()` | `Tab2Page.deleteUser()` | `LoadingController` ('Eliminando... (DELETE)') |

## Verificación recomendada antes de entregar

```bash
npm install
npm run lint
npm test -- --watch=false
npm run build
git status
```

