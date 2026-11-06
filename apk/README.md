# Distribución de APK y Guía de Demostración

**Proyecto:** Oráculo Deportivo (MiApp)  
**Versión:** 1.0.0 (Debug Build)  
**Archivo APK:** [`apk/app-debug.apk`](file:///c:/MiApp/apk/app-debug.apk)  
**Tamaño aproximado:** ~5.2 MB  
**Plataforma de destino:** Android 8.0+ (API Level 26+)  

---

## 1. Ubicación del APK

Para facilidad de evaluación y entrega directa, el instalador compilado se encuentra en:
```text
C:\MiApp\apk\app-debug.apk
```
*(Copia directa generada a partir de `android/app/build/outputs/apk/debug/app-debug.apk`)*.

---

## 2. Métodos de Instalación en Dispositivo Físico o Emulador

### Opción A: Mediante ADB (Android Debug Bridge)
Con el dispositivo conectado por USB con Depuración USB habilitada o con un emulador de Android Studio activo:
```bash
adb install -r C:\MiApp\apk\app-debug.apk
```

### Opción B: Transferencia Directa (Sideloading)
1. Copiar el archivo `app-debug.apk` a la memoria interna del teléfono o descargarlo directamente.
2. Abrir el explorador de archivos en el teléfono y pulsar sobre `app-debug.apk`.
3. Si el sistema lo solicita, conceder permiso a **"Instalar aplicaciones de orígenes desconocidos"**.
4. Confirmar la instalación y presionar **Abrir**.

---

## 3. Configuración Inicial de Red en la Demostración

La aplicación móvil se comunica con la API REST PHP/MySQL alojada en el servidor local. Para conectar el dispositivo móvil al servidor:

1. **Asegurar misma red Wi-Fi:** Conectar el teléfono y la computadora a la misma red local.
2. **Iniciar servidor:**
   - Iniciar Apache y MySQL en XAMPP.
   - Colocar el backend en el directorio `htdocs` (ej. `http://<TU_IP_LOCAL>/miapp-api/`).
3. **Configuración en caliente:**
   - Abrir la aplicación y pulsar sobre la pestaña **Origen** (`/tabs/origenes`).
   - Introducir la dirección IP de tu servidor (ej. `192.168.1.71` o la asignada por tu router).
   - Guardar cambios. La app actualizará automáticamente todas las peticiones a esa URL base sin reinstalar el APK.
4. **Modo Resiliente / Offline:**
   - Si no se cuenta con servidor local activo durante la demostración, la aplicación funciona de forma autónoma cargando el dataset precalculado offline y la persistencia en `Capacitor Preferences` con un banner explicativo.

---

## 4. Guion de Demostración en Video o Presentación en Vivo (Paso a Paso)

| Paso | Pantalla / Módulo | Acción en la Demostración | Requisito Demostrado |
| :--- | :--- | :--- | :--- |
| **1** | **Login** | Iniciar sesión con usuario `admin` y contraseña `password123`. Demostrar validación visual y respuesta de autenticación con Bearer Token. | Autenticación, API REST, Interfaz Funcional |
| **2** | **Mi Sesión (Tab 1)** | Mostrar datos del usuario autenticado, estado de persistencia en Capacitor Preferences y selector de Foto/Avatar Multimedia. Seleccionar un avatar interactivo o cargar imagen. | Persistencia Local, Elemento Multimedia |
| **3** | **Usuarios (Tab 2)** | Listar usuarios remotos con GET. Crear nuevo usuario (POST 201), editar con PUT/PATCH y eliminar con DELETE. Mostrar indicadores de carga (`LoadingController`). | CRUD Remoto Completo, Interfaz Funcional |
| **4** | **Prueba de Red** | Activar Modo Avión o apagar Wi-Fi. Demostrar banner offline inmediato en pantalla, notificación de fallback a caché local y persistencia de datos. | Manejo de Errores de Red, Sincronización |
| **5** | **Reconexión** | Desactivar Modo Avión. Demostrar evento de reconexión automático, re-sincronización con el servidor y actualización del banner a "Sincronizado". | Sincronización, Resiliencia |
| **6** | **Oráculo Deportivo (Tab 3)** | Inspeccionar gráficos interactivos, barra de probabilidades Over vs Under, filtro de Picks de Valor y cambio entre MLB y NFL. | Visualización de Datos, Algoritmos IA |
| **7** | **Narrador Multimedia** | Presionar el botón `▶ Escuchar Audio IA` en el panel de narrador multimedia. Demostrar síntesis de voz, ondas animadas en tiempo real del ecualizador y control de velocidad. | Elemento Multimedia, Interacción por Voz |

