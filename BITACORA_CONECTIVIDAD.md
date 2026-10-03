# Bitácora de conectividad y acceso a datos

## Problema 1: la aplicación no distinguía un error HTTP de una pérdida de red

- **Síntoma:** todos los fallos se presentaban únicamente como “No fue posible conectar”.
- **Causa:** Axios era capturado, pero no se registraban `response`, estado HTTP, URL ni estado del navegador.
- **Solución:** se creó `ApiDiagnosticService`. Ahora separa una respuesta HTTP de una solicitud sin respuesta y registra método, IP, URL, payload y cabeceras.
- **Resultado:** Login muestra el diagnóstico y Tab2/Tab3 abren un modal técnico.
- **Uso de IA:** ayudó a identificar los campos útiles de `AxiosError` y a proponer el enmascaramiento de contraseña, token y cabecera de autorización. El resultado se verificó mediante compilación y lint.

## Problema 2: la IP estaba repetida y las pantallas podían consultar servidores diferentes

- **Síntoma:** cambiar la IP en Login no garantizaba que Usuarios y Oráculo utilizaran el mismo servidor.
- **Causa:** las URLs podían escribirse directamente dentro de cada servicio.
- **Solución:** `ConnectionService` guarda un único JSON en Preferences y genera todas las URLs con `endpoint()`.
- **Resultado:** Login, CRUD de usuarios y predicciones MLB/NFL comparten protocolo, IP, puerto y ruta.
- **Uso de IA:** se utilizó para revisar la estructura del objeto y centralizar la construcción de endpoints. La pantalla Origen permite comprobar el JSON vigente.

## Problema 3: Usuarios y predicciones desaparecían cuando Apache no respondía

- **Síntoma:** al apagar Apache o desconectar la red, las listas quedaban vacías.
- **Causa:** los servicios dependían completamente de la respuesta actual de la API.
- **Solución:** se agregó `CacheService`. Cada consulta exitosa guarda usuarios y predicciones en Preferences. Si la consulta siguiente falla, el servicio devuelve la última copia y muestra su fecha.
- **Resultado:** la aplicación conserva lectura offline. Las altas, modificaciones y eliminaciones siguen requiriendo conexión para proteger la consistencia de MySQL.
- **Uso de IA:** ayudó a diseñar la estrategia “network first, cache fallback” y una prueba automatizada. La decisión final fue no permitir escrituras offline para evitar conflictos.

## Problema 4 La interfaz no podía recargarse completamente sin conexión

- **Síntoma:** Preferences conservaba los datos, pero al actualizar el navegador en modo Offline todavía era necesario descargar `index.html`, JavaScript, CSS e iconos.
- **Causa:** la aplicación no tenía un Service Worker y el Login utilizaba imágenes externas.
- **Solución:** se agregó Angular Service Worker con precarga del app shell, módulos lazy, assets e iconos. Las imágenes externas del Login se reemplazaron por SVG locales.
- **Resultado:** después de abrir la compilación de producción una vez con conexión, la página puede recargarse y navegarse desde la caché del navegador. Usuarios y Oráculo complementan esta capa con datos guardados en Preferences.
- **Uso de IA:** ayudó a separar la caché de interfaz de la caché de datos y a preparar el procedimiento reproducible de DevTools.

## Verificaciones realizadas

- `npm run build:pwa` y comprobación de `www/ngsw-worker.js` y `www/ngsw.json`.
- `npm run lint`.
- `npm test -- --watch=false`.
- Prueba automatizada `src/app/services/user-offline.spec.ts`.
- Prueba de eventos de red `src/app/services/network.service.spec.ts`.
- Prueba de persistencia `src/app/services/cache.service.spec.ts`.
