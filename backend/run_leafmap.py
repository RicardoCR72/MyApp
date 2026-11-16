#!/usr/bin/env python3
"""
Lanzador del mapa interactivo leafmap
Abre el mapa interactivo generado con leafmap directamente en tu navegador web.
"""

import os
import sys
import webbrowser

# Si se pasan coordenadas, regenera el mapa primero
if len(sys.argv) > 2:
    lat = sys.argv[1]
    lon = sys.argv[2]
    import subprocess
    script_dir = os.path.dirname(__file__)
    subprocess.run([sys.executable, os.path.join(script_dir, "generate_leafmap.py"), lat, lon])

html_file = os.path.join(os.path.dirname(__file__), "leafmap_standalone.html")

if not os.path.exists(html_file):
    import subprocess
    script_dir = os.path.dirname(__file__)
    subprocess.run([sys.executable, os.path.join(script_dir, "generate_leafmap.py")])

print(f"[+] Abriendo mapa interactivo de leafmap en el navegador: {html_file}")
webbrowser.open("file://" + os.path.abspath(html_file))
