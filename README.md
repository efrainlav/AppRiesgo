# 🧭 Plataforma de Gestión de Riesgo en Terreno · Windpeshi

[![Netlify Status](https://api.netlify.com/api/v1/badges/5a9ec68-netlify/deploy-status)](https://winpeshi.netlify.app/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First-0ea5e9?style=flat&logo=pwa)](https://winpeshi.netlify.app/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase%20PostgreSQL-3ecf8e?style=flat&logo=supabase)](https://supabase.com)
[![Leaflet](https://img.shields.io/badge/GIS-Leaflet%201.9-10b981?style=flat&logo=leaflet)](https://leafletjs.com)

> [!IMPORTANT]
> **Nota Aclaratoria / Demostración:**  
> La información, datos geográficos y registros visualizados en esta plataforma corresponden a una **demostración y prototipo funcional** de una herramienta tecnológica para la captura, monitoreo y gestión de información de riesgo en terreno. Su propósito es técnico y demostrativo.

---

## 📌 Descripción del Proyecto

**Windpeshi AppRiesgo** es una Progressive Web App (PWA) con capacidades SIG (Sistemas de Información Geográfica) diseñada para la captura georreferenciada, seguimiento y análisis de eventos y riesgos en zonas operativas y áreas de influencia del proyecto eólico en La Guajira, Colombia.

La plataforma fue concebida para operar en condiciones extremas de conectividad en terreno (*Offline-First*), permitiendo al personal de campo registrar novedades con evidencia fotográfica sin señal celular y sincronizarlas de forma automática a la nube cuando se recupera la conexión a internet.

---

## 🚀 Características Principales

### 1. 📴 Funcionamiento 100% Offline-First
- **Almacenamiento Local (IndexedDB):** Si no hay conexión a internet, los reportes y las fotografías tomadas en campo se guardan localmente en el dispositivo.
- **Service Worker con Estrategia Mixta:**
  - *Network-First* para la aplicación web, garantizando que siempre se use la versión más actualizada al estar en línea.
  - *Cache-First* para mosaicos de satélite, capas KML, GeoJSON y librerías, permitiendo navegar el mapa en medio del desierto sin datos móviles.
- **Sincronización en 1 Clic:** Botón de sincronización con contador visual que detecta reportes pendientes y los sube a la base de datos central cuando se detecta conexión.

### 2. 🗺️ Geovisor SIG Avanzado (Leaflet)
- **Capas de Infraestructura del Proyecto:**
  - 📍 Aerogeneradores (`Aeros_Parque.kml`).
  - 🗼 Torres y Línea de Transmisión (`Torres.kml`).
  - 📐 Polígono y Área del Parque (`Area_Parque.kml`).
  - 🏘️ Comunidades y Asentamientos Wayúu (`Comunidades_2026.kmz`).
  - 🌊 Ocupaciones de Cauce (`Ocupacion_Cauce_Linea.kml`, `Ocupaciones_Cauce_Parque.kml`).
- **Capas Viales y Accesos:**
  - 🛑 **Vía No Autorizada:** Simbología SIG con patrón de cruces rojas (`leaflet.polylineDecorator`).
  - 🛣️ **Vías de Medición:** Trazo café de alta precisión con borde exterior (*casing*).
  - 🚗 **Vía de Acceso Windpeshi:** Trazo discontinuo naranja de alta visibilidad.
- **Mapas Base Satelitales e Híbridos:** Google Satellite, Google Hybrid, Esri Satellite, CartoDB Positron y OpenStreetMap.

### 3. 📝 Levantamiento de Información de Riesgo
- **Taxonomía de Riesgo Estructurada:**
  - **Tipo de Riesgo (NRiesgo):** `Territorio`, `Seguridad Física`, `Predial`.
  - **Causalidad Dinámica:** Catálogo dependiente según la tipología del riesgo.
  - **Estado del Riesgo:** Distinción clara entre riesgo `Latente` (preventivo) y `Materializado` (incidente activo).
- **Geolocalización GPS de Alta Precisión:** Botón 🎯 para captura de coordenadas exactas del dispositivo móvil o selección manual directamente sobre el mapa.
- **Evidencias Fotográficas:** Carga y previsualización de hasta 5 imágenes por reporte con compresión y almacenamiento en la nube.

### 4. 🔒 Seguridad y Buenas Prácticas
- **Sanitización contra XSS:** Filtro estricto de URLs y escape HTML en popups y formularios.
- **Validación de Archivos:** Verificación de tipo MIME (`image/*`), límite máximo de tamaño (10 MB) y nombres criptográficamente seguros para evitar sobrescrituras.
- **Validación Geográfica:** Restricción de coordenadas al marco geográfico de Colombia.
- **Base de Datos Segura:** Integración con **Supabase (PostgreSQL)** protegida mediante **Row Level Security (RLS)**.

---

## 🛠️ Tecnologías Utilizadas

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 moderno (Glassmorphism & Responsive), Vanilla JavaScript (ES6+) |
| **Motor Cartográfico** | [Leaflet 1.9.4](https://leafletjs.com/), Leaflet PolylineDecorator, JSZip |
| **Offline / PWA** | Service Worker Cache API, IndexedDB API, Web Manifest |
| **Backend & Base de Datos** | [Supabase](https://supabase.com/) (PostgreSQL en la nube, Supabase Storage) |
| **Despliegue Continuo** | [Netlify](https://www.netlify.com/) (CI/CD automático desde GitHub) |
| **Analítica & BI** | Conexión directa a **Power BI Desktop** (PostgreSQL / REST API) |

---

## 📁 Estructura del Repositorio

```text
├── index.html                   # Aplicación principal (interfaz, lógica de mapa y formularios)
├── sw.js                        # Service Worker (gestión de caché offline, PWA y tiles)
├── _headers                     # Configuración de cabeceras HTTP y caché para Netlify
├── README.md                    # Documentación del proyecto
├── dm_causalidad.xlsx           # Diccionario de datos y matriz de riesgos
├── data/
│   └── layers.bin               # Contenedor seguro y ofuscado de capas SIG (KML, KMZ, GeoJSON)
├── js/
│   ├── leaflet.polylineDecorator.min.js  # Decorador para simbología de vías
│   └── leaflet.textpath.min.js          # Utilidad de texto sobre líneas
├── scripts/
│   └── pack_layers.py           # Herramienta para empaquetar capas locales en layers.bin
└── svg/                         # Simbología SVG personalizada
    ├── eolica.svg
    ├── hut.svg
    └── transmission-tower.svg
```

---

## 💻 Ejecución en Entorno Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/efrainlav/AppRiesgo.git
   cd AppRiesgo
   ```

2. Ejecuta un servidor web local (los Service Workers requieren ejecutarse bajo un servidor HTTP/HTTPS, no mediante `file://`):
   ```bash
   # Opción con Python:
   python3 -m http.server 8080

   # Opción con Node.js / npx:
   npx serve .
   ```

3. Abre en tu navegador:
   ```text
   http://localhost:8080
   ```

---

## 📊 Integración con Power BI

La base de datos de Supabase puede ser consumida directamente en **Power BI** para la creación de tableros de control ejecutivos y análisis espacial:

- **Conector PostgreSQL:** Conexión nativa a la tabla `reportes_campo` en modo *Import* o *DirectQuery* para visualizaciones en tiempo real.
- **Conector Web (API REST):** Consumo mediante endpoints HTTPS autorizados con cabecera `apikey`, ideal para entornos corporativos con restricciones de puertos.
- **Georreferenciación:** Las columnas `latitud` y `longitud` se integran automáticamente con los mapas de ArcGIS, Azure Maps o mapas nativos de Power BI.

---

## 📄 Licencia y Uso
Proyecto desarrollado con fines demostrativos y de prototipado tecnológico para la gestión y mitigación de riesgos operativos en proyectos de energía e infraestructura.
