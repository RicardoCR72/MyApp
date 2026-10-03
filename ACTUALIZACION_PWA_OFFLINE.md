# Actualización PWA offline

## Qué se almacena

- `ngsw-config.json` precarga `index.html`, archivos JavaScript, CSS, assets e iconos de Ionic.
- `CacheService` mantiene los últimos usuarios y predicciones MLB/NFL en Preferences.
- `AuthService` mantiene la sesión activa mientras el token no haya vencido.
- Los iconos del Login ahora son SVG locales y no dependen de Amazon S3.

## Cómo probarlo

```powershell
cd C:\MiApp
npm install
npm run build:pwa
npm run serve:pwa
```

Después:

1. Abrir `http://localhost:8100`.
2. Recargar una vez con conexión.
3. Confirmar `ngsw-worker.js` en **Application → Service Workers**.
4. Seleccionar **Network → Offline**.
5. Recargar la página y navegar entre las vistas.
6. Volver a **No throttling** para recuperar las peticiones reales.

El Service Worker solamente funciona en HTTPS o en `localhost`. La aplicación debe abrirse al menos una vez en línea para instalar y llenar la caché.
