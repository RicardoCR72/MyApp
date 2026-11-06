# Oráculo Deportivo · MiApp (Ionic + Angular + Capacitor)

Aplicación móvil híbrida y multiplataforma para consultar proyecciones deportivas de **MLB** y **NFL**, administrar usuarios mediante un servicio web REST en PHP/MySQL, con persistencia local resiliente, sincronización offline, elementos multimedia interactivos y paquete Android APK listo para distribución.

---

## 📋 Matriz de Cumplimiento de Requisitos

| # | Requisito Solicitado | Estado | Implementación y Evidencia en el Código |
|---|---|:---:|---|
| **1** | **Arquitectura Cliente-Servidor** | ✅ **Cumplido** | Cliente móvil Ionic/Angular/Capacitor en [`src/`](src/) y Servidor Web REST PHP/Apache/MySQL en [`backend/php-api/`](backend/php-api/). Documentado en [`docs/cliente-movil-servicio-web.md`](docs/cliente-movil-servicio-web.md). |
| **2** | **API REST** | ✅ **Cumplido** | Endpoints HTTP con métodos GET, POST, PUT, PATCH, DELETE y OPTIONS con payloads JSON y Bearer Token en [`backend/php-api/`](backend/php-api/) (`login.php`, `users.php`, `predictions.php`). |
| **3** | **CRUD remoto** | ✅ **Cumplido** | Operaciones Create (POST 201), Read (GET 200), Update (PUT/PATCH 200) y Delete (DELETE 200) integradas en [`src/app/services/user.service.ts`](src/app/services/user.service.ts) y vista interactiva en [`src/app/tab2/tab2.page.ts`](src/app/tab2/tab2.page.ts). |
| **4** | **Persistencia local** | ✅ **Cumplido** | Almacenamiento local mediante `@capacitor/preferences` en [`src/app/services/cache.service.ts`](src/app/services/cache.service.ts) y [`src/app/services/auth.service.ts`](src/app/services/auth.service.ts) para sesión, usuarios y predicciones. |
| **5** | **Sincronización** | ✅ **Cumplido** | [`src/app/services/sync.service.ts`](src/app/services/sync.service.ts) con listeners reactivos `online`/`offline`, banner dinámico en [`TabsPage`](src/app/tabs/tabs.page.html) y re-sincronización automática de datos al recuperar conexión. |
| **6** | **Manejo de errores de red** | ✅ **Cumplido** | Detección de pérdida de red, diagnósticos técnicos en [`src/app/services/api-diagnostic.service.ts`](src/app/services/api-diagnostic.service.ts), modal de error en [`api-error-modal`](src/app/shared/api-error-modal/) y fallback a datos locales sin congelar la interfaz. |
| **7** | **Elemento multimedia** | ✅ **Cumplido** | **Triple componente multimedia:**<br>1. *Audio y Voz IA:* Reproductor multimedia con Web Speech API y Web Audio API con ecualizador animado por CSS en [`src/app/tab3/tab3.page.html`](src/app/tab3/tab3.page.html).<br>2. *Visualización Gráfica Interactiva:* Gráfico comparativo de líneas vs proyección IA y barra de distribución de probabilidades Over/Under en Tab 3.<br>3. *Foto/Avatar:* Selector multimedia de foto de perfil y avatar con almacenamiento local en [`src/app/tab1/tab1.page.html`](src/app/tab1/tab1.page.html). |
| **8** | **Interfaz funcional** | ✅ **Cumplido** | Navegación por tabs (Sesión, Usuarios, Oráculo, Origen) 100% responsiva para móvil y escritorio con feedback visual (`LoadingController`, spinners, badges, toasts). |
| **9** | **Repositorio** | ✅ **Cumplido** | Repositorio Git estructurado en [`https://github.com/RicardoCR72/MyApp.git`](https://github.com/RicardoCR72/MyApp.git) con historial limpio y `.gitignore` configurado. |
| **10** | **APK/demostración** | ✅ **Cumplido** | Instalador Android compilado ubicado en [`apk/app-debug.apk`](apk/app-debug.apk) con guía de instalación y guion de demostración en [`apk/README.md`](apk/README.md) y [`ENTREGA_ELEMENTO_MULTIMEDIA_IA.md`](ENTREGA_ELEMENTO_MULTIMEDIA_IA.md). |
| **11** | **Documentación de endpoints** | ✅ **Cumplido** | Documentación exhaustiva de endpoints, métodos, headers, request/response body, códigos HTTP y ejemplos cURL en [`docs/documentacion-endpoints.md`](docs/documentacion-endpoints.md). |
| **12** | **Bitácora de IA** | ✅ **Cumplido** | Registro cronológico integral de co-programación con prompts, desafíos técnicos, validación humana y conclusiones en [`BITACORA_IA.md`](BITACORA_IA.md) y [`docs/bitacora-ia.md`](docs/bitacora-ia.md). |

---

## Vistas implementadas

1. **Login (`/login`)**: valida credenciales contra la API PHP, guarda el token y protege las rutas internas.
2. **Sesión (`/tabs/tab1`)**: muestra la cuenta autenticada y permite cerrar sesión.
3. **Usuarios (`/tabs/tab2`)**: lista, crea, edita parcialmente y elimina usuarios mediante la API REST.
4. **Oráculo deportivo (`/tabs/tab3`)**: consulta predicciones reales de MLB y NFL almacenadas en XAMPP.

## Tecnologías

- Ionic 9
- Angular 22 con NgModules
- Axios
- PHP 8.2 con PDO
- MariaDB/MySQL
- Capacitor
- Capacitor Preferences para persistencia local y caché de datos
- Angular Service Worker para almacenar la interfaz y permitir recargas offline

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
    ├── user.service.ts    Consumo del CRUD de usuarios
    └── oracle.service.ts  Predicciones MLB y NFL

backend/php-api/
├── config/database.php    Conexión PDO
├── models/User.php        Modelo utilizado por el login
├── login.php              Inicio de sesión
├── users.php              CRUD REST de usuarios
├── predictions.php        Consulta e importación del Oráculo
├── python/
│   └── sync_oracle.py     Sincroniza salidas Python con XAMPP
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
- Los últimos usuarios y predicciones MLB/NFL se almacenan temporalmente en Preferences y se muestran si la API queda fuera de línea.
- La aplicación escucha eventos `online`/`offline`, genera diagnósticos de Axios y muestra mensajes o modales según el fallo.
- La evidencia y pasos de prueba están en `PRUEBA_SIN_CONEXION.md`; los problemas y soluciones están en `BITACORA_CONECTIVIDAD.md`.
- `AuthService.initialize()` restaura la sesión antes de evaluar las rutas protegidas.
- Una sesión vencida o el botón **Cerrar sesión** eliminan los valores persistentes.

La guía de demostración está en [`docs/persistencia-preferences.md`](docs/persistencia-preferences.md).

La IP de la API se escribe en el Login y se guarda como JSON mediante `ConnectionService` y Preferences. Todas las pantallas construyen sus endpoints desde esa misma configuración.

## Prueba PWA sin conexión

El modo offline completo requiere una compilación de producción; `ionic serve` es un servidor de desarrollo y no es la prueba correcta del Service Worker.

```bash
npm run build:pwa
npm run serve:pwa
```

Abrir `http://localhost:8100`, esperar a que el Service Worker aparezca como activado en DevTools y recargar una vez con conexión. Después seleccionar **Network → Offline** y actualizar la página. La interfaz se obtiene del Service Worker y Usuarios/Oráculo usan las copias guardadas en Preferences.

La configuración de la PWA está en:

```text
ngsw-config.json
src/app/app.module.ts
src/assets/manifest.webmanifest
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
| GET | `/predictions.php?sport=MLB` | Consultar predicciones MLB |
| GET | `/predictions.php?sport=NFL` | Consultar predicciones NFL |
| POST | `/predictions.php` | Importar resultados de los modelos |

El CRUD requiere un usuario administrador y el encabezado:

```http
Authorization: Bearer TOKEN_GENERADO_EN_LOGIN
```

## Modelo inicial de datos

El modelo entidad-relación y la descripción de campos están disponibles en [`docs/modelo-datos.md`](docs/modelo-datos.md). Incluye usuarios, sesiones, partidos, ejecuciones y predicciones.

## Sincronización del Oráculo

La guía completa está en [`docs/integracion-oraculo.md`](docs/integracion-oraculo.md). Ejemplo para NFL:

```bat
set ORACLE_USERNAME=admin
set ORACLE_PASSWORD=password
python backend\\python\\sync_oracle.py ^
  --nfl-totals ruta\\nfl_totales.csv ^
  --nfl-props ruta\\nfl_props.csv
```

Para MLB, el modelo F5 debe exportar el contrato mostrado en `backend/python/mlb_f5_example.csv`.

El diagrama de las clases principales se encuentra en [`docs/diagrama-clases.md`](docs/diagrama-clases.md).

## Evidencias técnicas

La correspondencia entre cada requisito y los archivos que lo implementan está documentada en [`docs/evidencias-entrega.md`](docs/evidencias-entrega.md).

El documento sobre el uso de inteligencia artificial está disponible en [`docs/uso-ia.md`](docs/uso-ia.md).

## Capturas de ejecución

La guía y los nombres esperados están en [`docs/capturas/README.md`](docs/capturas/README.md). Las capturas deben tomarse con Apache, MySQL e Ionic en ejecución para que reflejen los datos del entorno local.

## Repositorio Git

Para registrar la entrega en un repositorio:

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
