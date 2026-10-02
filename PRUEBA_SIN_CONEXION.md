# Prueba de funcionamiento sin conexión

## Prueba automatizada

Ejecutar:

```powershell
npm test -- --watch=false
```

La prueba `user-offline.spec.ts` simula una API sin respuesta y verifica que `UserService` entregue los usuarios de Preferences con origen `cache`.

## Demostración manual para video

1. Encender Apache y MySQL.
2. Iniciar sesión y abrir **Usuarios** y **Oráculo** al menos una vez. Esto genera las copias locales.
3. Mostrar que ambas pantallas tienen información.
4. Apagar Apache desde XAMPP o desactivar temporalmente la red.
5. Actualizar Usuarios.
6. Verificar el modal con “sin respuesta” y cerrar el modal.
7. Comprobar que los usuarios siguen visibles y aparece “Mostrando usuarios guardados”.
8. Repetir en Oráculo y comprobar que permanecen las predicciones.
9. Volver a encender Apache o la red y actualizar.
10. Comprobar que desaparece el aviso offline y se reemplaza la caché con datos actuales.

## Resultado esperado

- La aplicación detecta el cambio de red.
- El error no cierra la aplicación.
- Aparece un mensaje entendible y un modal técnico.
- Usuarios y predicciones permanecen visibles usando Preferences.
- Se muestra la fecha en que se guardó la información.
- Crear, editar y eliminar requieren conexión; no se simula una escritura que MySQL no haya confirmado.
