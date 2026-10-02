# Actualización: JSON de conexión y diagnóstico API

## Instalación

Extraer este ZIP en la raíz de `C:\MiApp` y permitir que Windows reemplace los archivos existentes. Después ejecutar:

```powershell
cd C:\MiApp
npm install
npx cap sync android
ionic serve
```

## Mapeo

- `src/app/services/connection.service.ts`: crea, valida y guarda el JSON en Preferences con la clave `data_source_config_json`. También construye todos los endpoints.
- `src/app/services/api-diagnostic.service.ts`: obtiene red, estado HTTP, URL, IP, payload y cabeceras; enmascara contraseña y autorización.
- `src/app/services/api-error-modal.service.ts`: abre el modal de errores.
- `src/app/services/auth.service.ts`: login con la IP del JSON y registro del diagnóstico.
- `src/app/services/user.service.ts`: CRUD de usuarios con la IP del JSON.
- `src/app/services/oracle.service.ts`: predicciones MLB/NFL con la IP del JSON.
- `src/app/login/*`: input de IP y panel dinámico debajo de la contraseña.
- `src/app/data-sources/*`: nueva pantalla Orígenes de datos.
- `src/app/shared/api-error-modal/*`: modal reutilizable para errores API.
- `src/app/tabs/*`: ruta y botón de la nueva pantalla.
- `src/app/tab2/*` y `src/app/tab3/*`: muestran automáticamente el modal cuando falla una API.

## Flujo

1. El usuario escribe una IPv4 en Login.
2. `ConnectionService` la convierte en un objeto JSON y lo guarda en Preferences.
3. Los servicios generan URLs con `ConnectionService.endpoint()`.
4. Login presenta el diagnóstico debajo de la contraseña.
5. Usuarios y Oráculo abren el modal técnico cuando ocurre un error.
6. La pestaña Origen muestra el protocolo, IP, puertos, ruta y JSON vigentes.

MySQL `3306` aparece como dato informativo. Ionic solo llama a Apache/PHP por HTTP `80`; PHP es quien se comunica con MySQL.
