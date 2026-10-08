import { View, StyleSheet, Text } from 'react-native';
import { useMemo, useRef, useEffect } from 'react';
import React from 'react';

export type ZonePolygonProp = {
  coordinates: Array<{ latitude: number; longitude: number }>;
  color?: string;
  fillColor?: string;
  name?: string;
  risk_level?: string;
};

export type MapMarkerProp = {
  latitude: number;
  longitude: number;
  title: string;
  color?: string;
  icon?: string;
  subtitle?: string;
  category?: 'safe' | 'caution' | 'danger' | 'police' | 'medical' | 'user';
};

export type RealMapProps = {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
    zoom?: number;
  };
  markers?: MapMarkerProp[];
  route?: Array<{ latitude: number; longitude: number }>;
  polygon?: Array<{ latitude: number; longitude: number }>;
  polygons?: ZonePolygonProp[];
  activeLayer?: 'all' | 'safe' | 'caution' | 'police';
  tileStyle?: 'voyager' | 'satellite' | 'streets' | 'topo';
  overlayTitle?: string;
  overlayText?: string;
  height?: number | string;
};

function buildMapHtml({
  region,
  markers = [],
  route = [],
  polygon = [],
  polygons = [],
  activeLayer = 'all',
  tileStyle = 'voyager',
}: {
  region: RealMapProps['region'];
  markers?: MapMarkerProp[];
  route?: Array<{ latitude: number; longitude: number }>;
  polygon?: Array<{ latitude: number; longitude: number }>;
  polygons?: ZonePolygonProp[];
  activeLayer?: string;
  tileStyle?: string;
}) {
  const allPolygons: ZonePolygonProp[] = [...polygons];
  if (polygon && polygon.length > 2) {
    allPolygons.push({
      coordinates: polygon,
      color: '#0284C7',
      fillColor: '#0284C7',
      name: 'Primary Safe Boundary',
    });
  }

  const markersJson = JSON.stringify(markers || []);
  const routeJson = JSON.stringify((route || []).map((p) => [p.latitude, p.longitude]));
  const polygonsJson = JSON.stringify(
    allPolygons.map((poly) => ({
      coords: poly.coordinates.map((p) => [p.latitude, p.longitude]),
      color:
        poly.color ||
        (poly.risk_level === 'critical' || poly.risk_level === 'high'
          ? '#ef4444'
          : poly.risk_level === 'medium'
          ? '#f59e0b'
          : '#10b981'),
      fillColor:
        poly.fillColor ||
        (poly.risk_level === 'critical' || poly.risk_level === 'high'
          ? '#ef4444'
          : poly.risk_level === 'medium'
          ? '#f59e0b'
          : '#10b981'),
      name: poly.name || 'Safety Zone',
      risk_level: poly.risk_level || 'low',
    }))
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #F1F5F9;
      touch-action: pan-x pan-y pinch-zoom;
    }

    /* Google Maps Styled Popups */
    .leaflet-popup-content-wrapper {
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #0F172A;
      border-radius: 14px;
      border: 1px solid rgba(226, 232, 240, 0.9);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      padding: 2px;
    }
    .leaflet-popup-tip {
      background: #FFFFFF;
    }
    .leaflet-popup-content {
      font-size: 13px;
      font-weight: 600;
      margin: 10px 14px;
      line-height: 1.4;
      color: #0F172A;
    }

    /* Custom Icons */
    .user-marker-wrap {
      position: relative;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-dot {
      width: 18px;
      height: 18px;
      background: #0284C7;
      border: 3.5px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(2, 132, 199, 0.7);
      position: relative;
      z-index: 2;
    }
    .radar-cone {
      position: absolute;
      width: 70px;
      height: 70px;
      top: -15px;
      left: -15px;
      background: radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.45) 0%, rgba(2, 132, 199, 0.12) 55%, transparent 75%);
      clip-path: polygon(50% 50%, 95% 15%, 85% 95%);
      pointer-events: none;
      transform-origin: center center;
    }

    .safe-haven-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #10B981;
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 0 16px rgba(16, 185, 129, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-size: 15px;
    }

    .police-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #2563EB;
      border: 2px solid #FFFFFF;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-size: 13px;
    }

    .medical-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #EF4444;
      border: 2px solid #FFFFFF;
      box-shadow: 0 0 14px rgba(239, 68, 68, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-weight: 900;
      font-size: 15px;
    }

    .caution-badge {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #F59E0B;
      border: 2px solid #FFFFFF;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-weight: 900;
      font-size: 13px;
    }

    .danger-badge {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #EF4444;
      border: 2px solid #FFFFFF;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-weight: 900;
      font-size: 15px;
    }

    /* Hide Leaflet default attribution to keep view ultra-clean */
    .leaflet-control-attribution {
      font-size: 9px !important;
      background: rgba(255,255,255,0.7) !important;
      border-radius: 4px;
      margin: 4px !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    // Initialize map with smooth pan, zoom, touch, and inertia
    var map = L.map('map', {
      zoomControl: false,
      inertia: true,
      inertiaDeceleration: 3000,
      inertiaMaxSpeed: 1500,
      easeLinearity: 0.25,
      tap: true,
      wheelPxPerZoomLevel: 60,
    }).setView([${region.latitude}, ${region.longitude}], ${region.zoom || 14});

    // Tile providers: CartoDB Voyager gives Google-Maps-grade aesthetics with authorized key
    var cartoKey = '${process.env.EXPO_PUBLIC_CARTO_API_KEY || "cb1_4dmw_1_e00d97a2c5d7b772bc21755c"}';
    var tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' + (cartoKey ? '?key=' + cartoKey : '');
    var subdomains = 'abcd';
    var maxZoom = 20;

    ${
      tileStyle === 'satellite'
        ? `tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'; subdomains = 'abc'; maxZoom = 19;`
        : tileStyle === 'topo'
        ? `tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'; subdomains = 'abc'; maxZoom = 17;`
        : ''
    }

    var baseLayer = L.tileLayer(tileUrl, {
      subdomains: subdomains,
      maxZoom: maxZoom,
      attribution: '&copy; CartoDB & OpenStreetMap contributors'
    }).addTo(map);

    baseLayer.on('tileerror', function(error, tile) {
      if (tile && !tile._hasFallback) {
        tile._hasFallback = true;
        var coords = error.coords;
        tile.src = 'https://tile.openstreetmap.org/' + coords.z + '/' + coords.x + '/' + coords.y + '.png';
      }
    });

    var layerGroups = {
      safe: L.layerGroup().addTo(map),
      caution: L.layerGroup().addTo(map),
      police: L.layerGroup().addTo(map),
      general: L.layerGroup().addTo(map)
    };

    // ── GEOFENCE POLYGONS ───────────────────────────────────
    var polygons = ${polygonsJson};
    polygons.forEach(function(poly) {
      if (poly.coords && poly.coords.length > 2) {
        var p = L.polygon(poly.coords, {
          color: poly.color,
          weight: 2.2,
          fillColor: poly.fillColor,
          fillOpacity: 0.26
        });
        p.bindPopup('<strong style="font-size:13px;color:#0F172A;">' + poly.name + '</strong><br/><span style="font-size:11px;color:#64748B;">Risk Level: ' + (poly.risk_level || 'Normal').toUpperCase() + '</span>');
        
        if (poly.risk_level === 'critical' || poly.risk_level === 'high' || poly.risk_level === 'medium') {
          p.addTo(layerGroups.caution);
        } else {
          p.addTo(layerGroups.safe);
        }
      }
    });

    // ── SAFE HAVEN CIRCLE AT KODAIKANAL LAKE ─────────────────
    var safeHavenCircle = L.circle([10.2381, 77.4892], {
      radius: 460,
      color: '#10B981',
      fillColor: '#10B981',
      fillOpacity: 0.16,
      weight: 1.8,
      dashArray: '5, 5'
    }).addTo(layerGroups.safe);
    safeHavenCircle.bindPopup('<strong>Kodaikanal Lake Safe Haven</strong><br/><span style="color:#059669;">Active Geofenced Safety Perimeter</span>');

    // ── WALKING ROUTE CORRIDOR ──────────────────────────────
    var route = ${routeJson};
    if (route.length > 1) {
      L.polyline(route, {
        color: '#10B981',
        weight: 4,
        opacity: 0.9,
        dashArray: '6, 8',
        lineCap: 'round'
      }).addTo(layerGroups.safe);
    }

    // ── MARKERS ─────────────────────────────────────────────
    var markers = ${markersJson};
    markers.forEach(function (m) {
      var category = m.category || 'general';
      var customHtml = '';

      if (category === 'user') {
        customHtml = '<div class="user-marker-wrap"><div class="radar-cone"></div><div class="user-dot"></div></div>';
      } else if (category === 'safe') {
        customHtml = '<div class="safe-haven-icon">🛡️</div>';
      } else if (category === 'police') {
        customHtml = '<div class="police-icon">👮</div>';
      } else if (category === 'medical') {
        customHtml = '<div class="medical-icon">+</div>';
      } else if (category === 'caution') {
        customHtml = '<div class="caution-badge">!</div>';
      } else if (category === 'danger') {
        customHtml = '<div class="danger-badge">!</div>';
      } else {
        customHtml = '<div style="background-color:' + (m.color || '#0284c7') + ';width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:bold;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);">' + (m.icon || '📍') + '</div>';
      }

      var icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: customHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });

      var marker = L.marker([m.latitude, m.longitude], { icon: icon, title: m.title });
      var popup = '<strong style="color:#0F172A;font-size:13px;">' + m.title + '</strong>';
      if (m.subtitle) {
        popup += '<br/><span style="color:#64748B;font-size:11px;font-weight:500;">' + m.subtitle + '</span>';
      }
      marker.bindPopup(popup);

      if (category === 'police') {
        marker.addTo(layerGroups.police);
      } else if (category === 'caution' || category === 'danger') {
        marker.addTo(layerGroups.caution);
      } else if (category === 'safe') {
        marker.addTo(layerGroups.safe);
      } else {
        marker.addTo(layerGroups.general);
      }
    });

    // Handle Active Layer Filtering
    var activeLayer = '${activeLayer}';
    if (activeLayer === 'safe') {
      map.removeLayer(layerGroups.caution);
      map.removeLayer(layerGroups.police);
      if (!map.hasLayer(layerGroups.safe)) map.addLayer(layerGroups.safe);
    } else if (activeLayer === 'caution') {
      map.removeLayer(layerGroups.safe);
      map.removeLayer(layerGroups.police);
      if (!map.hasLayer(layerGroups.caution)) map.addLayer(layerGroups.caution);
    } else if (activeLayer === 'police') {
      map.removeLayer(layerGroups.safe);
      map.removeLayer(layerGroups.caution);
      if (!map.hasLayer(layerGroups.police)) map.addLayer(layerGroups.police);
    } else {
      if (!map.hasLayer(layerGroups.safe)) map.addLayer(layerGroups.safe);
      if (!map.hasLayer(layerGroups.caution)) map.addLayer(layerGroups.caution);
      if (!map.hasLayer(layerGroups.police)) map.addLayer(layerGroups.police);
    }

    // Message listener for external controls (recenter, zoom, styles)
    window.addEventListener('message', function(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'RECENTER') {
          map.flyTo([data.latitude || 10.2381, data.longitude || 77.4892], data.zoom || 15, {
            duration: 1.2
          });
        }
      } catch(e) {}
    });
  </script>
</body>
</html>`;
}

export default function RealMap({
  region,
  markers = [],
  route = [],
  polygon = [],
  polygons = [],
  activeLayer = 'all',
  tileStyle = 'voyager',
  overlayTitle,
  overlayText,
  height = '100%',
}: RealMapProps) {
  const html = useMemo(
    () =>
      buildMapHtml({
        region,
        markers,
        route,
        polygon,
        polygons,
        activeLayer,
        tileStyle,
      }),
    [region, markers, route, polygon, polygons, activeLayer, tileStyle]
  );

  const isFull = height === '100%' || height === undefined;

  return (
    <View style={[styles.wrapper, isFull && styles.fullWrapper]}>
      <View
        style={[
          styles.frame,
          isFull ? styles.fullFrame : { height: typeof height === 'number' ? height : 360 },
        ]}
      >
        {React.createElement('iframe', {
          title: 'TourSafe Google-Maps-grade Live Map',
          srcDoc: html,
          loading: 'eager',
          style: {
            width: '100%',
            height: '100%',
            border: 0,
            display: 'block',
          },
        })}
      </View>

      {(overlayTitle || overlayText) && (
        <View style={styles.overlay}>
          {overlayTitle ? <Text style={styles.overlayTitle}>{overlayTitle}</Text> : null}
          {overlayText ? <Text style={styles.overlayText}>{overlayText}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  fullWrapper: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  frame: {
    width: '100%',
    overflow: 'hidden',
  },
  fullFrame: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  overlayTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  overlayText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
