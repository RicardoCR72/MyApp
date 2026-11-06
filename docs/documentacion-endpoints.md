# Especificación y Documentación Oficial de Endpoints API REST

**Proyecto:** Oráculo Deportivo (MiApp Backend)  
**Tecnología del Backend:** PHP 8+ / Apache / PDO MySQL  
**Protocolo:** HTTP/1.1 con intercambio de datos en formato JSON  
**Seguridad:** Tokens de autenticación Bearer (`Authorization: Bearer <token>`) y contraseñas cifradas con `BCRYPT`.  
**Formato de respuesta estándar:** JSON con cabecera `Content-Type: application/json; charset=utf-8`.

---

## 1. Convenciones y Encabezados Globales

### Encabezados de Petición (Request Headers)
| Encabezado | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `Content-Type` | String | Sí (en POST, PUT, PATCH) | Debe ser `application/json; charset=utf-8`. |
| `Authorization` | String | Sí (en rutas protegidas) | Formato `Bearer <token_generado_en_login>`. |
| `Accept` | String | Recomendado | `application/json`. |

### Códigos de Estado HTTP Utilizados
* `200 OK`: Consulta o actualización exitosa.
* `201 Created`: Recurso creado exitosamente (ej. nuevo usuario).
* `204 No Content`: Petición preflight OPTIONS procesada sin cuerpo de respuesta.
* `400 Bad Request`: Payload JSON inválido o campos obligatorios faltantes.
* `401 Unauthorized`: Token ausente, inválido o expirado.
* `403 Forbidden`: Permisos insuficientes (ej. rol no administrador).
* `404 Not Found`: Recurso solicitado inexistente.
* `409 Conflict`: Conflicto de unicidad (nombre de usuario o correo ya registrado).
* `405 Method Not Allowed`: Método HTTP no implementado para la ruta.
* `500 Internal Server Error`: Fallo de conexión a base de datos o error interno.

---

## 2. Catálogo Detallado de Endpoints

### 2.1 Autenticación (`login.php`)

#### `POST /login.php`
Permite a un usuario autenticarse mediante sus credenciales y recibir un token Bearer para peticiones posteriores.

* **Seguridad:** Pública.
* **Cuerpo de la Petición (Request Body):**
```json
{
  "username": "admin",
  "password": "password123"
}
```

* **Validaciones:**
  * `username`: Obligatorio, texto no vacío.
  * `password`: Obligatorio, mínimo 8 caracteres.

* **Respuestas:**
  * **200 OK (Autenticación exitosa):**
  ```json
  {
    "success": true,
    "message": "Autenticación exitosa.",
    "token": "4f9d2c18e76a0b12c4d8e5f3...",
    "expiresAt": "2026-11-06T12:00:00.000Z",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@oraculo.local",
      "fullName": "Administrador Principal",
      "role": "admin"
    }
  }
  ```
  * **401 Unauthorized (Credenciales inválidas):**
  ```json
  {
    "success": false,
    "message": "Usuario o contraseña incorrectos."
  }
  ```

* **Ejemplo cURL:**
```bash
curl -X POST "http://localhost/miapp-api/login.php" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

---

### 2.2 Gestión de Usuarios / CRUD Remoto (`users.php`)

Todos los métodos en `users.php` (a excepción de OPTIONS) requieren cabecera `Authorization: Bearer <token>`.

---

#### `GET /users.php`
Lista todos los usuarios registrados en el sistema.

* **Seguridad:** Requiere Bearer Token.
* **Respuestas:**
  * **200 OK:**
  ```json
  {
    "success": true,
    "count": 2,
    "data": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@oraculo.local",
        "fullName": "Administrador Principal",
        "role": "admin",
        "status": "active",
        "lastLoginAt": "2026-11-05T20:00:00.000Z",
        "createdAt": "2026-10-01T00:00:00.000Z",
        "updatedAt": "2026-11-05T20:00:00.000Z"
      },
      {
        "id": 2,
        "username": "usuario",
        "email": "usuario@oraculo.local",
        "fullName": "Usuario Operativo",
        "role": "user",
        "status": "active",
        "lastLoginAt": null,
        "createdAt": "2026-10-01T00:00:00.000Z",
        "updatedAt": "2026-10-01T00:00:00.000Z"
      }
    ]
  }
  ```

* **Ejemplo cURL:**
```bash
curl -X GET "http://localhost/miapp-api/users.php" \
  -H "Authorization: Bearer <TOKEN>"
```

---

#### `GET /users.php?id={id}`
Obtiene el detalle de un usuario específico por su identificador único.

* **Parámetros de URL:**
  * `id` (int, obligatorio): ID del usuario.
* **Respuestas:**
  * **200 OK:** Devuelve el objeto del usuario en `data`.
  * **404 Not Found:** `{"success": false, "message": "Usuario no encontrado."}`

---

#### `POST /users.php`
Crea un nuevo usuario en la base de datos remota.

* **Seguridad:** Requiere Bearer Token con rol `admin`.
* **Cuerpo de la Petición:**
```json
{
  "username": "carlos_analista",
  "email": "carlos@oraculo.local",
  "password": "PasswordSegura2026",
  "fullName": "Carlos Mendoza",
  "role": "user",
  "status": "active"
}
```

* **Respuestas:**
  * **201 Created:**
  ```json
  {
    "success": true,
    "message": "Usuario creado correctamente.",
    "data": {
      "id": 3,
      "username": "carlos_analista",
      "email": "carlos@oraculo.local",
      "fullName": "Carlos Mendoza",
      "role": "user",
      "status": "active"
    }
  }
  ```
  * **409 Conflict:** `{"success": false, "message": "El nombre de usuario o correo ya está en uso."}`

* **Ejemplo cURL:**
```bash
curl -X POST "http://localhost/miapp-api/users.php" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"username":"carlos_analista","email":"carlos@oraculo.local","password":"PasswordSegura2026","fullName":"Carlos Mendoza","role":"user","status":"active"}'
```

---

#### `PUT /users.php?id={id}`
Reemplaza completamente los campos de un usuario existente.

* **Parámetros de URL:** `id` (int, obligatorio).
* **Cuerpo de la Petición:** Todos los campos requeridos (`username`, `email`, `fullName`, `role`, `status`). Si incluye `password`, se actualiza la contraseña.
* **Respuestas:**
  * **200 OK:**
  ```json
  {
    "success": true,
    "message": "Usuario actualizado completamente (PUT).",
    "data": {
      "id": 3,
      "username": "carlos_mendoza",
      "email": "carlos.mendoza@oraculo.local",
      "fullName": "Carlos E. Mendoza",
      "role": "admin",
      "status": "active"
    }
  }
  ```

* **Ejemplo cURL:**
```bash
curl -X PUT "http://localhost/miapp-api/users.php?id=3" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"username":"carlos_mendoza","email":"carlos.mendoza@oraculo.local","fullName":"Carlos E. Mendoza","role":"admin","status":"active"}'
```

---

#### `PATCH /users.php?id={id}`
Actualiza parcialmente uno o más campos de un usuario (ej. solo rol o solo nombre).

* **Parámetros de URL:** `id` (int, obligatorio).
* **Cuerpo de la Petición:** Puede contener un subconjunto de campos:
```json
{
  "status": "inactive"
}
```
* **Respuestas:**
  * **200 OK:**
  ```json
  {
    "success": true,
    "message": "Usuario modificado parcialmente (PATCH).",
    "data": {
      "id": 3,
      "status": "inactive"
    }
  }
  ```

---

#### `DELETE /users.php?id={id}`
Elimina un usuario del sistema y sus sesiones activas asociadas en cascada.

* **Parámetros de URL:** `id` (int, obligatorio).
* **Respuestas:**
  * **200 OK:**
  ```json
  {
    "success": true,
    "message": "Usuario eliminado correctamente."
  }
  ```
  * **400 Bad Request:** No se permite que un administrador se autoelimine.

* **Ejemplo cURL:**
```bash
curl -X DELETE "http://localhost/miapp-api/users.php?id=3" \
  -H "Authorization: Bearer <TOKEN>"
```

---

#### `OPTIONS /users.php`
Permite responder favorablemente al preflight de CORS de navegadores web y clientes móviles.

* **Respuesta:** `204 No Content` con cabeceras `Access-Control-Allow-Methods` y `Access-Control-Allow-Headers`.

---

### 2.3 Oráculo Deportivo & Modelos Predictivos (`predictions.php`)

#### `GET /predictions.php`
Obtiene el catálogo de proyecciones matemáticas y de Machine Learning para partidos de béisbol (MLB) o fútbol americano (NFL).

* **Parámetros de URL (Query String):**
  | Parámetro | Tipo | Opciones | Descripción |
  | :--- | :--- | :--- | :--- |
  | `sport` | String | `MLB`, `NFL` | Filtro de deporte. Por defecto: `MLB`. |
  | `pickStatus` | String | `all`, `PICK`, `NO_PICK`, `REVISAR` | Filtrado por condición de valor. |
  | `limit` | Int | Entero positivo | Límite de partidos devueltos. |

* **Respuesta:**
  * **200 OK:**
  ```json
  {
    "success": true,
    "sport": "MLB",
    "count": 5,
    "data": [
      {
        "id": 101,
        "externalGameId": "MLB_20261019_NYY_BOS",
        "sport": "MLB",
        "season": 2026,
        "week": null,
        "gameDate": "2026-10-19T18:05:00.000Z",
        "awayTeam": "New York Yankees",
        "homeTeam": "Boston Red Sox",
        "venue": "Fenway Park",
        "marketType": "F5_TOTAL",
        "line": 4.5,
        "predictedValue": 3.8,
        "selection": "UNDER",
        "probability": 0.635,
        "overProbability": 0.365,
        "underProbability": 0.635,
        "confidence": 8.5,
        "edge": 0.082,
        "odds": -115,
        "expectedValue": 0.12,
        "pickStatus": "PICK",
        "calibrationMethod": "isotonic",
        "modelVersion": "v2.4",
        "notes": "Viento hacia adentro 12mph en Fenway"
      }
    ]
  }
  ```

* **Ejemplo cURL:**
```bash
curl -X GET "http://localhost/miapp-api/predictions.php?sport=MLB&pickStatus=PICK" \
  -H "Authorization: Bearer <TOKEN>"
```

