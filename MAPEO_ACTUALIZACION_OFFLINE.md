# Mapeo de actualización offline

Extraer el ZIP en `C:\MiApp`, reemplazar los archivos y ejecutar:

```powershell
npm install
npx cap sync android
npm test -- --watch=false
ionic serve
```

## Archivos principales

- `src/app/services/network.service.ts`: escucha eventos online y offline.
- `src/app/services/cache.service.ts`: guarda objetos temporales con fecha en Capacitor Preferences.
- `src/app/services/user.service.ts`: estrategia network-first y fallback de usuarios.
- `src/app/services/oracle.service.ts`: estrategia network-first y fallback MLB/NFL.
- `src/app/services/api-diagnostic.service.ts`: usa el estado centralizado de red.
- `src/app/tab2/*`: aviso de usuarios recuperados y fecha de caché.
- `src/app/tab3/*`: aviso de predicciones recuperadas y fecha de caché.
- `src/app/services/*.spec.ts`: pruebas de caché, red y recuperación offline.
- `BITACORA_CONECTIVIDAD.md`: tres problemas, causas y soluciones.
- `PRUEBA_SIN_CONEXION.md`: pasos para prueba automatizada y demostración en video.

## Claves de Preferences

- `offline_cache_users`
- `offline_cache_predictions_mlb`
- `offline_cache_predictions_nfl`

La caché es solamente para consultas. Crear, modificar y eliminar continúa requiriendo conexión y confirmación de la API/MySQL.
