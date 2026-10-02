# Integración del Oráculo MLB + NFL

## Objetivo

La aplicación Ionic presenta las predicciones generadas por los modelos Python de MLB y NFL. Los modelos no se ejecutan dentro de Ionic: generan archivos de salida, el puente Python los envía a la API PHP y PHP los persiste en MySQL de XAMPP.

## Flujo

1. El modelo Python genera un CSV de predicciones.
2. `backend/python/sync_oracle.py` inicia sesión en la API.
3. El script transforma cada fila al contrato común del Oráculo.
4. `predictions.php` valida el token y exige rol administrador para el POST.
5. PHP inserta o actualiza `sports_games`, `predictions` y `model_runs`.
6. `OracleService` consulta la API mediante Axios.
7. Tab3 permite alternar entre MLB y NFL.

## Preparación de XAMPP

1. Encender Apache y MySQL.
2. Importar nuevamente `backend/php-api/database.sql` en phpMyAdmin. Las instrucciones utilizan `CREATE TABLE IF NOT EXISTS` e `INSERT IGNORE`, por lo que conservan los usuarios existentes.
3. Copiar el contenido actualizado de `backend/php-api` en `C:\xampp\htdocs\miapp-api`.
4. Iniciar sesión en Ionic antes de abrir Tab3, porque el GET de predicciones requiere token.

## Importar NFL

El adaptador reconoce directamente las columnas actuales de los CSV de totales y props:

```bat
set ORACLE_USERNAME=admin
set ORACLE_PASSWORD=password
set ORACLE_API_URL=http://localhost/miapp-api

python backend\python\sync_oracle.py ^
  --nfl-totals D:\ruta\nfl_totales_2026_semana_3.csv ^
  --nfl-props D:\ruta\nfl_props_2026_semana_3.csv
```

Las filas sin línea, selección o probabilidad se omiten y se reportan en consola.

## Importar MLB F5

El CSV debe seguir el encabezado de `backend/python/mlb_f5_example.csv`. Cada juego puede aparecer tres veces, una por línea F5 3.5, 4.5 y 5.5.

```bat
python backend\python\sync_oracle.py ^
  --mlb-csv D:\ruta\mlb_f5_hoy.csv
```

También se admite un JSON normalizado:

```bat
python backend\python\sync_oracle.py --mlb-json D:\ruta\mlb_f5_hoy.json
```

## Consultas disponibles

```http
GET /predictions.php?sport=MLB
GET /predictions.php?sport=NFL
GET /predictions.php?sport=NFL&week=3
GET /predictions.php?sport=MLB&date=2026-10-02
GET /predictions.php?sport=NFL&marketType=GAME_TOTAL&pickStatus=PICK
```

Todas requieren el encabezado `Authorization: Bearer TOKEN_DEL_LOGIN`.

## Uso en un teléfono físico

`localhost` dentro del teléfono apunta al propio teléfono. Para probar Ionic en un dispositivo, configurar `environment.ts` con la IP local de la computadora:

```ts
apiUrl: 'http://192.168.1.20/miapp-api'
```

El teléfono y la computadora deben estar en la misma red y Apache debe aceptar conexiones locales.

## Seguridad

- Las contraseñas no se incluyen en los CSV.
- El script obtiene un token mediante `login.php`.
- Consultar requiere una sesión activa.
- Importar requiere rol `admin`.
- MySQL no se expone directamente a la aplicación Ionic.
