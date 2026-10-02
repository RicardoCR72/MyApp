# Conexión dinámica por red local

## Funcionamiento

El login solicita la IP del equipo que ejecuta XAMPP. Con la IP `192.168.1.71`, la aplicación construye:

```text
http://192.168.1.71/miapp-api
```

Ionic se comunica únicamente con Apache por el puerto 80. PHP se comunica localmente con MySQL por el puerto 3306. La aplicación no abre una conexión directa a MySQL ni contiene sus credenciales.

## Instalación

1. Copiar los archivos del ZIP sobre la raíz de `C:\MiApp`, conservando las carpetas.
2. Copiar `backend\php-api` en `C:\xampp\htdocs\miapp-api`.
3. Encender Apache y MySQL.
4. Ejecutar `ipconfig` y buscar la dirección IPv4 del adaptador conectado.
5. Desde otro dispositivo de la misma red, abrir `http://IP/miapp-api/login.php` para comprobar que Apache sea visible.
6. Permitir Apache HTTP Server en el Firewall de Windows para redes privadas si el navegador no conecta.
7. Ejecutar `npm install`, `ionic serve` y, para Android, `npx cap sync android`.

## Uso

En el login escribir solamente la IP, por ejemplo:

```text
192.168.1.71
```

No escribir `/miapp-api`; la aplicación lo agrega automáticamente. Se acepta `:80`, pero se rechazan otros puertos.

La configuración se guarda como JSON con Capacitor Preferences bajo la clave `data_source_config_json`:

```json
{
  "version": 1,
  "name": "XAMPP Oracle API",
  "protocol": "http",
  "ip": "192.168.1.71",
  "apachePort": 80,
  "mysqlPort": 3306,
  "apiPath": "miapp-api",
  "updatedAt": "2026-10-02T00:00:00.000Z"
}
```

La pestaña **Origen** permite consultar y modificar este objeto. `AuthService`, `UserService` y `OracleService` usan `ConnectionService.endpoint()`, por lo que login, CRUD y predicciones toman la IP del mismo JSON.

Debajo de la contraseña, el login muestra el estado de red, URL/IP destino, estado HTTP, payload y cabeceras. Si Usuarios u Oráculo reciben un error, aparece un modal con el diagnóstico de la petición. La contraseña, la cabecera de autorización y el token se muestran enmascarados.

## Puertos

- `80`: teléfono o navegador hacia Apache/PHP.
- `3306`: PHP hacia MySQL dentro del equipo con XAMPP.
- `8100`: servidor de desarrollo de Ionic, solamente durante pruebas con `ionic serve`.

No se debe abrir el puerto 3306 al teléfono ni colocar el usuario root de MySQL dentro de Angular.
