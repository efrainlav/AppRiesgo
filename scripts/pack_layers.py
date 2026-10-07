#!/usr/bin/env python3
"""
Script de utilidad para empaquetar y ofuscar las capas SIG (KML, KMZ, GeoJSON)
en el contenedor binario seguro data/layers.bin.

Uso:
    python3 scripts/pack_layers.py
"""
import os, zipfile, io, json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(OUT_DIR, exist_ok=True)

def round_coords(geom):
    def _round(c):
        if isinstance(c[0], (int, float)):
            return [round(c[0], 6), round(c[1], 6)]
        return [_round(sub) for sub in c]
    if 'coordinates' in geom:
        geom['coordinates'] = _round(geom['coordinates'])
    return geom

print("1. Empaquetando capas KML, KMZ y GeoJSON...")
buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    # KMLs
    kml_names = ['Torres.kml', 'Aeros_Parque.kml', 'Area_Parque.kml', 'Ocupacion_Cauce_Linea.kml', 'Ocupaciones_Cauce_Parque.kml']
    for kml in kml_names:
        p = os.path.join(BASE_DIR, 'kml', kml)
        if os.path.exists(p):
            with open(p, 'rb') as f:
                zf.writestr(kml, f.read())
            print(f"  ✓ Agregado: {kml}")

    # KMZ Comunidades
    kmz_path = os.path.join(BASE_DIR, 'kml/Comunidades_2026.kmz')
    if os.path.exists(kmz_path):
        with open(kmz_path, 'rb') as f:
            zf.writestr('Comunidades_2026.kmz', f.read())
        print("  ✓ Agregado: Comunidades_2026.kmz")

    # GeoJSON Vias Medicion
    vm_path = os.path.join(BASE_DIR, 'shp/Vias_Medicion.geojson')
    if os.path.exists(vm_path):
        with open(vm_path) as f:
            d = json.load(f)
            for feat in d['features']:
                feat['geometry'] = round_coords(feat['geometry'])
            zf.writestr('Vias_Medicion.json', json.dumps(d, separators=(',', ':')))
        print("  ✓ Agregado y optimizado: Vias_Medicion.json")

    # GeoJSON Via No Autorizada
    vna_path = os.path.join(BASE_DIR, 'shp/Via_No_Autorizada.geojson')
    if os.path.exists(vna_path):
        with open(vna_path) as f:
            d = json.load(f)
            for feat in d['features']:
                feat['geometry'] = round_coords(feat['geometry'])
            zf.writestr('Via_No_Autorizada.json', json.dumps(d, separators=(',', ':')))
        print("  ✓ Agregado y optimizado: Via_No_Autorizada.json")

    # GeoJSON Via Acceso Windpeshi
    va_path = os.path.join(BASE_DIR, 'shp/Via_Acceso_Windpeshi.geojson')
    if os.path.exists(va_path):
        with open(va_path) as f:
            d = json.load(f)
            for feat in d['features']:
                feat['geometry'] = round_coords(feat['geometry'])
                p = feat.get('properties', {})
                feat['properties'] = {
                    'PROYECTO': p.get('PROYECTO'),
                    'TIPO_INFRA': p.get('TIPO_INFRA'),
                    'OPERADOR': p.get('OPERADOR'),
                    'CARACTER': p.get('CARACTER'),
                    'LONGITUD_M': p.get('LONGITUD_M'),
                    'OBSERV': p.get('OBSERV')
                }
            zf.writestr('Via_Acceso_Windpeshi.json', json.dumps(d, separators=(',', ':')))
        print("  ✓ Agregado y optimizado: Via_Acceso_Windpeshi.json")

zip_bytes = buf.getvalue()

print("2. Aplicando ofuscación binaria (WNDP + XOR stream cipher)...")
MAGIC = b'WNDP\x01\x00'
KEY = b'W1ndP3sh1_G1S_2026'

encrypted = bytearray(MAGIC)
for i, b in enumerate(zip_bytes):
    encrypted.append(b ^ KEY[i % len(KEY)])

out_file = os.path.join(OUT_DIR, 'layers.bin')
with open(out_file, 'wb') as f:
    f.write(encrypted)

print(f"✓ ¡Listo! Archivo protegido generado exitosamente: data/layers.bin ({len(encrypted):,} bytes)")
