#!/usr/bin/env python3
"""
GeoSport Radar - Generador de Mapas con Leafmap (Python)
Utiliza la librería oficial leafmap (https://leafmap.org) con servidores Esri y capas HYBRID
para garantizar visualización nítida, sin bloqueos 403 y con capas satelitales en alta resolución.
"""

import os
import sys
import math
import folium
import leafmap.foliumap as leafmap

# Coordenadas por defecto (Durango / México o pasadas por argumento)
USER_LAT = float(sys.argv[1]) if len(sys.argv) > 1 else 24.0277
USER_LON = float(sys.argv[2]) if len(sys.argv) > 2 else -104.6532

print(f"[*] Generando mapa con leafmap para coordenadas: {USER_LAT}, {USER_LON}")

# Sedes deportivas
VENUES = [
    {"name": "Estadio Francisco Sarabia", "city": "Durango", "team": "Polideportivo", "league": "POLI", "lat": 24.0277, "lon": -104.6532, "color": "blue"},
    {"name": "Estadio Francisco Villa", "city": "Durango", "team": "Caliente de Durango (LMB)", "league": "MLB", "lat": 24.0321, "lon": -104.6409, "color": "orange"},
    {"name": "Estadio Corona (TSM)", "city": "Torreón", "team": "Santos Laguna", "league": "LIGA_MX", "lat": 25.6267, "lon": -103.4144, "color": "green"},
    {"name": "Estadio de la Revolución", "city": "Torreón", "team": "Algodoneros (LMB)", "league": "MLB", "lat": 25.5398, "lon": -103.4357, "color": "orange"},
    {"name": "Estadio Azteca", "city": "CDMX", "team": "Club América / NFL Mexico", "league": "LIGA_MX", "lat": 19.3029, "lon": -99.1505, "color": "green"},
    {"name": "Estadio Alfredo Harp Helú", "city": "CDMX", "team": "Diablos Rojos (LMB/MLB)", "league": "MLB", "lat": 19.4038, "lon": -99.0911, "color": "orange"},
    {"name": "Estadio BBVA", "city": "Monterrey", "team": "Rayados", "league": "LIGA_MX", "lat": 25.6698, "lon": -100.2447, "color": "green"},
    {"name": "Estadio Akron", "city": "Guadalajara", "team": "Chivas", "league": "LIGA_MX", "lat": 20.6816, "lon": -103.4627, "color": "green"},
    {"name": "AT&T Stadium", "city": "Dallas", "team": "Dallas Cowboys (NFL)", "league": "NFL", "lat": 32.7473, "lon": -97.0945, "color": "red"},
    {"name": "Dodger Stadium", "city": "Los Ángeles", "team": "LA Dodgers (MLB)", "league": "MLB", "lat": 34.0739, "lon": -118.2400, "color": "orange"},
]

# Inicializar mapa interactivo con leafmap usando Esri.WorldTopoMap (100% libre de bloqueos 403)
m = leafmap.Map(
    center=[USER_LAT, USER_LON],
    zoom=13,
    tiles="Esri.WorldTopoMap",
    draw_control=True,
    measure_control=True
)

# Capas satelitales y de relieve en leafmap
m.add_basemap("HYBRID")
m.add_basemap("ROADMAP")

# Marcador de ubicación del usuario
user_icon = folium.Icon(color="blue", icon="user", prefix="fa")
folium.Marker(
    location=[USER_LAT, USER_LON],
    tooltip="Tu Ubicación Actual",
    popup=f"<b>Tu Ubicación Actual (GPS)</b><br>Lat: {USER_LAT:.6f}<br>Lon: {USER_LON:.6f}",
    icon=user_icon
).add_to(m)

# Círculo de precisión
folium.Circle(
    location=[USER_LAT, USER_LON],
    radius=120,
    color="#3880ff",
    fill=True,
    fill_color="#3880ff",
    fill_opacity=0.25
).add_to(m)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

closest_v = None
min_dist = float("inf")

for v in VENUES:
    dist = haversine(USER_LAT, USER_LON, v["lat"], v["lon"])
    v["dist"] = dist
    if dist < min_dist:
        min_dist = dist
        closest_v = v

    popup_text = f"<b>{v['name']}</b><br>Equipo: {v['team']}<br>Liga: {v['league']}<br>Distancia: <b>{dist} km</b>"
    v_icon = folium.Icon(color=v["color"], icon="info-sign")
    folium.Marker(
        location=[v["lat"], v["lon"]],
        tooltip=f"{v['name']} ({dist} km)",
        popup=popup_text,
        icon=v_icon
    ).add_to(m)

# Trazar línea hacia el estadio más cercano
if closest_v:
    coords = [[USER_LAT, USER_LON], [closest_v["lat"], closest_v["lon"]]]
    folium.PolyLine(
        coords,
        color="#2dd55b",
        weight=4,
        opacity=0.85,
        dash_array="8, 8",
        tooltip=f"Ruta directa hacia {closest_v['name']} ({min_dist} km)"
    ).add_to(m)

# Directorios de salida
out_paths = [
    os.path.join(os.path.dirname(__file__), "..", "src", "assets", "leafmap", "leafmap_map.html"),
    os.path.join(os.path.dirname(__file__), "..", "www", "assets", "leafmap", "leafmap_map.html"),
    os.path.join(os.path.dirname(__file__), "leafmap_standalone.html")
]

for p in out_paths:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    m.to_html(p)
    print(f"[✓] Mapa leafmap exportado a: {p}")

print("\n[OK] Mapa interactivo generado con éxito con leafmap.")
