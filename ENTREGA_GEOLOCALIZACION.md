# GeoSport Radar - Entrega de Geolocalización, Mapas Leaflet y Funcionalidad Basada en Ubicación

**Proyecto:** GeoSport Radar (Basado en la arquitectura Ionic + Angular NgModules de MiApp)  
**Materia / Práctica:** Geolocalización Móvil e Interactividad con Mapas  
**Estudiante:** Ricardo Cabral Rocha  
**Tecnologías:** Ionic 9, Angular 22 (NgModules), Leaflet.js ("leafmap"), HTML5 Geolocation API, OpenStreetMap, TypeScript, RxJS.

---

## 📋 Resumen de Cumplimiento de Criterios de Entrega

| Criterio Solicitado | Estado | Implementación Técnica en Código |
| :--- | :---: | :--- |
| **1. Solicitud adecuada de permisos** | **Cumple** | `navigator.permissions.query({ name: 'geolocation' })` y `navigator.geolocation.getCurrentPosition()`. Botón interactivo *"Solicitar Permiso & Ubicar"*, escucha reactiva de cambios de estado del permiso (`prompt`, `granted`, `denied`). |
| **2. Obtención de latitud y longitud** | **Cumple** | Lectura precisa de `coords.latitude`, `coords.longitude`, `coords.accuracy` (m), `coords.altitude`, `coords.speed` y `coords.heading`, además del timestamp satelital. Soporta seguimiento en tiempo real con `watchPosition()`. |
| **3. Visualización de coordenadas** | **Cumple** | Tarjetas de diseño moderno con coordenadas decimales (`1.6-6`), conversión a Grados, Minutos y Segundos (DMS: `24° 1' 39.7" N`), métricas de telemetría y botón para copiar coordenadas al portapapeles. |
| **4. Funcionalidad basada en ubicación** | **Cumple** | **Radar de Sedes Deportivas (MLB, NFL, Liga MX y Polideportivos):** Cálculo de distancia geodésica real mediante la **Fórmula del Semiverseno (Haversine)**, cálculo de rumbo cardinal (N, NE, E, etc.), ordenamiento automático de sedes de menor a mayor distancia, tarjeta destacada con la sede más cercana y estimación de tiempo de viaje. |
| **5. Manejo de errores / permisos rechazados** | **Cumple** | Detección explícita de códigos de error W3C (`1: PERMISSION_DENIED`, `2: POSITION_UNAVAILABLE`, `3: TIMEOUT`). Panel visual de error con explicación clara, pasos guiados para desbloquear la ubicación en el navegador/dispositivo y botón de reintento. Incluye banco de simulación para pruebas en escritorio. |
| **6. Mapa interactivo con Leaflet ("leafmap")** | **Cumple** | Integración completa de Leaflet con OpenStreetMap en la pestaña `tab2`: marcador de usuario con pulso animado, círculo de radio de precisión, marcadores temáticos por deporte, popups con datos y línea geodésica punteada conectando con la sede más próxima. |
| **7. Captura o video desde dispositivo** | **Listo** | Guía paso a paso y servidor listo para ejecutar tanto en la PC como en el teléfono celular en la misma red Wi-Fi para realizar la grabación de pantalla. |

---

## 🚀 Cómo Ejecutar la Aplicación

Abre una terminal PowerShell y navega a la carpeta de la app:

```powershell
cd "C:\Users\rcabr\.gemini\antigravity\scratch\geo_app"
```

### Opción A (Recomendada - Servidor Rápido PWA):
El bundle de producción ya está compilado y listo para servir:
```powershell
npm run serve:pwa
```
Abre tu navegador en: **`http://localhost:8100`**

### Opción B (Servidor de Desarrollo Angular Live Reload):
```powershell
npm start
```
Esto arrancará el servidor en `http://localhost:8100` y escuchará en todas las interfaces de red (`--host 0.0.0.0`).

### 📱 Para abrirlo desde tu celular (misma red Wi-Fi):
1. Revisa tu IP local en la PC con `ipconfig` (ejemplo: `192.168.1.15`).
2. En el navegador de tu celular (Chrome o Safari) ingresa a: `http://TU_IP_LOCAL:8100`.
3. Tu celular solicitará el permiso nativo de ubicación directamente.

---

## 🎥 Guía Paso a Paso para la Grabación del Video / Capturas

Para obtener la calificación máxima en tu entrega, te recomendamos estructurar tu video o capturas en este orden:

### Paso 1: Solicitud de Permisos y Permiso Concedido
1. Entra a la pestaña **Coordenadas** (`tab1`).
2. Haz clic en el botón azul **"Solicitar Permiso & Ubicar"**.
3. Muestra el cuadro de diálogo del navegador/celular pidiendo *"¿Permitir que la app conozca tu ubicación?"* y selecciona **Permitir**.
4. Observa cómo el badge superior cambia a verde **"GPS Activo"**.

### Paso 2: Visualización de Coordenadas
1. Muestra la tarjeta principal donde aparecen:
   - **Latitud y Longitud** en grados decimales y en formato DMS (Grados, Minutos, Segundos).
   - **Precisión** en metros (ej. `± 8.5 m`).
   - Hora exacta de la lectura satelital.
2. Presiona el botón **"Copiar Coordenadas"** para mostrar el mensaje de confirmación verde *"¡Coordenadas copiadas al portapapeles!"*.
3. Opcional: Activa el botón **"Rastreo Continuo"** para demostrar el modo en tiempo real.

### Paso 3: Funcionalidad Basada en Ubicación (Pestaña "Radar Sedes")
1. Cambia a la pestaña **Radar Sedes** (`tab3`).
2. Muestra la tarjeta destacada **"SEDE MÁS CERCANA A TU POSICIÓN"**:
   - Observa cómo calcula en tiempo real la distancia en kilómetros (Fórmula de Haversine), el rumbo y el tiempo estimado en auto.
3. Muestra la lista de estadios ordenados automáticamente por proximidad (del más cercano al más lejano).
4. Aplica los filtros de ligas (**MLB**, **NFL**, **Liga MX**) y el filtro de distancia máxima para demostrar la interactividad.

### Paso 4: Mapa Leaflet Interactivo ("leafmap")
1. Cambia a la pestaña **Mapa Leaflet** (`tab2`).
2. Muestra el mapa interactivo:
   - Tu marcador azul con animación de pulso y el círculo translúcido de precisión.
   - Los pines de los estadios con sus respectivos emojis e iconos.
   - La línea verde punteada que traza la ruta hacia el estadio más cercano.
3. Toca un marcador para abrir su popup con la información del equipo y la distancia.
4. Presiona el botón flotante inferior (FAB) para recentrar el mapa en tu ubicación.

### Paso 5: Prueba de Manejo de Errores / Permisos Rechazados
1. Haz clic en el icono del candado en la barra de direcciones del navegador.
2. Cambia la opción de *Ubicación* a **Bloquear** o **Denegar**.
3. Regresa a la app y pulsa **"Actualizar Coordenadas"**.
4. Muestra en pantalla el panel rojo de diagnóstico que se activa de inmediato:
   - Título: *"Acceso a Ubicación Denegado"*.
   - Código W3C: `1 (PERMISSION_DENIED)`.
   - Instrucciones paso a paso para que el usuario sepa cómo resolverlo.
   - Botón *"Reintentar Solicitud de Permisos"*.

---

## 🏛️ Estructura Modular del Proyecto (NgModules)

Siguiendo fielmente la estructura con la que montaste **MiApp**:

```
geo_app/
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   └── geo.service.ts          # Servicio reactivo de GPS, Haversine, venues y permissions
│   │   ├── tab1/                       # Pestaña 1: Coordenadas, telemetría y diagnóstico
│   │   │   ├── tab1.module.ts          # NgModule con imports de Ionic
│   │   │   ├── tab1.page.ts            # Lógica de coordenadas y simulación
│   │   │   ├── tab1.page.html          # Vista de tarjetas y errores
│   │   │   └── tab1.page.scss          # Estilos modernos
│   │   ├── tab2/                       # Pestaña 2: Mapa interactivo Leaflet ("leafmap")
│   │   │   ├── tab2.module.ts          # NgModule
│   │   │   ├── tab2.page.ts            # Lógica de capas, pines y flyTo
│   │   │   ├── tab2.page.html          # Vista de mapa a pantalla completa y FABs
│   │   │   └── tab2.page.scss
│   │   ├── tab3/                       # Pestaña 3: Funcionalidad basada en ubicación (Radar)
│   │   │   ├── tab3.module.ts          # NgModule
│   │   │   ├── tab3.page.ts            # Filtros y ordenamiento Haversine
│   │   │   ├── tab3.page.html          # Hero card y lista ordenada
│   │   │   └── tab3.page.scss
│   │   ├── tabs/                       # Pestaña de navegación (Tabs bar)
│   │   │   ├── tabs.module.ts
│   │   │   └── tabs-routing.module.ts
│   │   ├── app.module.ts               # Módulo raíz de la aplicación
│   │   └── app-routing.module.ts       # Enrutador principal
│   ├── global.scss                     # Estilos globales y pines personalizados de Leaflet
│   └── index.html                      # Vinculación de Leaflet CSS/JS y metatags móviles
├── package.json
└── angular.json
```
