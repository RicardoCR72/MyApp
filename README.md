# Oráculo MLB · Ionic Angular

Aplicación móvil/web para consultar probabilidades predictivas de MLB, administrar usuarios y controlar el acceso mediante autenticación. El proyecto está construido con Ionic + Angular usando NgModules, una API PHP y MariaDB/MySQL.

## Objetivo

Centralizar en una interfaz sencilla los resultados del modelo predictivo **Oráculo MLB**, especialmente las probabilidades Over/Under de primeras cinco entradas (F5). La primera etapa implementa autenticación y administración de usuarios; la siguiente conectará el modelo Python para publicar predicciones diarias.

## Vistas implementadas

1. **Login (`/login`)**: valida credenciales contra la API PHP, guarda el token y protege las rutas internas.
2. **Sesión (`/tabs/tab1`)**: muestra la cuenta autenticada y permite cerrar sesión.
3. **Usuarios (`/tabs/tab2`)**: lista, crea, edita parcialmente y elimina usuarios mediante la API REST.
4. **Oráculo MLB (`/tabs/tab3`)**: pantalla principal y presentación de los mercados F5 3.5, 4.5 y 5.5 que recibirá del modelo.

## Tecnologías

- Ionic 9
- Angular 22 con NgModules
- Axios
- PHP 8.2 con PDO
- MariaDB/MySQL
- Capacitor
- Capacitor Preferences para persistencia local de la sesión

## Estructura relevante

```text
src/app/
├── login/                 Vista de autenticación
├── tab1/                  Información de sesión
├── tab2/                  Administración de usuarios
├── tab3/                  Inicio del Oráculo MLB
└── services/
    ├── auth.service.ts    Login, token y sesión
    ├── auth.guard.ts      Protección de rutas
    └── user.service.ts    Consumo del CRUD de usuarios

backend/php-api/
├── config/database.php    Conexión PDO
├── models/User.php        Modelo utilizado por el login
├── login.php              Inicio de sesión
├── users.php              CRUD REST de usuarios
└── database.sql           Estructura y carga inicial
```

## Instalación del frontend

```bash
npm install
ionic serve
```

Después de instalar dependencias o al preparar Android/iOS, sincronizar Capacitor:

```bash
npx cap sync
```

## Persistencia

- `users` y `auth_tokens` permanecen en MySQL/MariaDB mediante la API PHP.
- El token, el usuario autenticado y la expiración se almacenan con Capacitor Preferences.
- `AuthService.initialize()` restaura la sesión antes de evaluar las rutas protegidas.
- Una sesión vencida o el botón **Cerrar sesión** eliminan los valores persistentes.

La guía de demostración está en [`docs/persistencia-preferences.md`](docs/persistencia-preferences.md).

La URL de la API se configura en:

```text
src/environments/environment.ts
src/environments/environment.prod.ts
```

Para XAMPP local se utiliza:

```ts
apiUrl: 'http://localhost/miapp-api'
```

## Instalación del backend

1. Copiar el contenido de `backend/php-api` en `C:\xampp\htdocs\miapp-api`.
2. Encender Apache y MySQL desde XAMPP.
3. Importar `backend/php-api/database.sql` desde phpMyAdmin.
4. Verificar `http://localhost/miapp-api/login.php`.

## API

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/login.php` | Autenticar y obtener token |
| GET | `/users.php` | Listar usuarios |
| GET | `/users.php?id=1` | Obtener un usuario |
| POST | `/users.php` | Crear usuario |
| PUT | `/users.php?id=1` | Reemplazar usuario |
| PATCH | `/users.php?id=1` | Actualizar campos específicos |
| DELETE | `/users.php?id=1` | Eliminar usuario |
| OPTIONS | `/users.php` | Preflight CORS |

El CRUD requiere un usuario administrador y el encabezado:

```http
Authorization: Bearer TOKEN_GENERADO_EN_LOGIN
```

## Modelo inicial de datos

El modelo entidad-relación y la descripción de campos están disponibles en [`docs/modelo-datos.md`](docs/modelo-datos.md). La primera etapa utiliza `users` y `auth_tokens`.

El diagrama de las clases principales se encuentra en [`docs/diagrama-clases.md`](docs/diagrama-clases.md).

## Evidencias técnicas

La correspondencia entre cada requisito y los archivos que lo implementan está documentada en [`docs/evidencias-entrega.md`](docs/evidencias-entrega.md).

El documento sobre el uso de inteligencia artificial está disponible en [`docs/uso-ia.md`](docs/uso-ia.md).

## Capturas de ejecución

La guía y los nombres esperados están en [`docs/capturas/README.md`](docs/capturas/README.md). Las capturas deben tomarse con Apache, MySQL e Ionic en ejecución para que reflejen los datos del entorno local.

## Repositorio Git

El proyecto ya incluye un repositorio Git. Para registrar esta entrega:

```bash
git status
git add .
git commit -m "feat: agregar usuarios e inicio del Oraculo MLB"
```

Después se puede enlazar a GitHub y publicar:

```bash
git remote add origin URL_DEL_REPOSITORIO
git branch -M main
git push -u origin main
```

No deben publicarse contraseñas reales, tokens, archivos `.env` ni respaldos con datos sensibles.
