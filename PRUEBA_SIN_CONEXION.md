# Prueba de funcionamiento sin conexión

## Prueba automatizada

Ejecutar:

```powershell
npm test -- --watch=false
```

La prueba `user-offline.spec.ts` simula una API sin respuesta y verifica que `UserService` entregue los usuarios de Preferences con origen `cache`.

## Demostración manual para video

1. Ejecutar `npm run build:pwa`.
2. Ejecutar `npm run serve:pwa`.
3. Abrir `http://localhost:8100` con conexión y recargar una vez.
4. Encender Apache y MySQL, iniciar sesión y abrir **Usuarios** y **Oráculo**. Esto genera las copias locales.
5. Abrir DevTools, entrar en **Application → Service Workers** y comprobar que `ngsw-worker.js` está activado.
6. Entrar en **Network** y seleccionar **Offline**.
7. Actualizar completamente la página. La interfaz debe seguir cargando.
8. Abrir Usuarios y comprobar el aviso “Mostrando usuarios guardados”.
9. Abrir Oráculo y comprobar que permanecen las predicciones guardadas.
10. Volver a seleccionar **No throttling**, encender Apache si fue apagado y actualizar.
11. Comprobar que desaparece el aviso offline y se reemplaza la caché con datos actuales.

Importante: no usar `ionic serve` para demostrar una recarga PWA, porque el Service Worker se genera en la compilación de producción.

## Resultado esperado

- La aplicación detecta el cambio de red.
- El error no cierra la aplicación.
- Aparece un mensaje entendible y un modal técnico.
- Usuarios y predicciones permanecen visibles usando Preferences.
- La interfaz, rutas, JavaScript, CSS, iconos y recursos locales se cargan desde el Service Worker.
- Se muestra la fecha en que se guardó la información.
- Crear, editar y eliminar requieren conexión; no se simula una escritura que MySQL no haya confirmado.
