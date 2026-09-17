# Uso de inteligencia artificial en el desarrollo

## Objetivo

Se utilizó una herramienta de inteligencia artificial generativa como apoyo para diseñar, generar y revisar el modelo inicial de la aplicación **Oráculo MLB**. La IA funcionó como asistente técnico; las decisiones finales, la ejecución y la validación permanecieron bajo responsabilidad del desarrollador.

## Actividades apoyadas por IA

1. **Revisión del modelo de datos.** Se analizaron las necesidades de autenticación y administración de usuarios. A partir de ellas se propusieron las entidades `users` y `auth_tokens`, su relación uno a muchos, llaves únicas y la eliminación en cascada de tokens.
2. **Generación inicial de interfaces.** Se propusieron interfaces TypeScript como `AuthUser`, `LoginResponse`, `UserRecord` y `CreateUserInput` para evitar datos sin tipo entre las páginas y los servicios.
3. **Diseño de servicios.** Se generó una primera versión de `AuthService` y `UserService`, utilizando Axios y separando el acceso a datos de la lógica de las vistas.
4. **Revisión de seguridad.** Se revisó que las contraseñas se almacenaran con `password_hash()`, que la API validara tokens, que el CRUD requiriera rol de administrador y que las consultas utilizaran PDO con sentencias preparadas.
5. **Revisión técnica.** La IA ayudó a identificar incompatibilidades entre Angular 22 e imports antiguos de Ionic, y a migrar los componentes visuales a la configuración compatible sin eliminar los NgModules de la aplicación.
6. **Documentación.** Se utilizó IA para estructurar el README, el modelo entidad-relación y el diagrama sencillo de clases.

## Validación humana y técnica

Las propuestas no se aceptaron automáticamente. Se verificaron mediante:

- Revisión manual de nombres, tipos, rutas y reglas de negocio.
- Compilación del proyecto con Angular CLI.
- Ejecución del linter.
- Ejecución de las pruebas unitarias disponibles.
- Pruebas locales del login contra PHP, Apache y MariaDB/MySQL.
- Prueba manual de navegación entre las vistas y del CRUD de usuarios.

## Resultado

El uso de IA redujo el tiempo necesario para preparar código repetitivo, detectar errores de compatibilidad y documentar la solución. Sin embargo, la configuración del entorno, las credenciales, las pruebas de ejecución y la decisión de conservar Angular NgModules fueron controladas por el desarrollador.

No se enviaron contraseñas reales ni tokens activos como parte de las instrucciones utilizadas para generar el código.

