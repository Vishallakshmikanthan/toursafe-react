import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

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
}: {
  region: RealMapProps['region'];
  markers?: MapMarkerProp[];
  route?: Array<{ latitude: number; longitude: number }>;
  polygon?: Array<{ latitude: number; longitude: number }>;
  polygons?: ZonePolygonProp[];
}) {
  const allPolygons: ZonePolygonProp[] = [...polygons];
  if (polygon && polygon.length > 2) {
    allPolygons.push({
      coordinates: polygon,
      color: '#0284C7',
      fillColor: '#0284C7',
      name: 'Primary Boundary',
    });
  }

  const markersJson = JSON.stringify(markers || []);
  const routeJson = JSON.stringify((route || []).map((p) => [p.latitude, p.longitude]));
  const polygonsJson = JSON.stringify(
    allPolygons.map((poly) => ({
      coords: (poly.coordinates || []).map((p: { latitude: number; longitude: number }) => [p.latitude, p.longitude]),
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
    }))
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { -webkit-tap-highlight-color: transparent; }
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F8FAFC; overflow: hidden; }
    .leaflet-popup-content-wrapper { background: #FFFFFF; color: #0F172A; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 4px 16px rgba(15,23,42,0.15); }
    .leaflet-popup-tip { background: #FFFFFF; }
    .leaflet-popup-content { font-size: 13px; font-weight: 600; margin: 10px 14px; line-height: 1.4; color: #0F172A; }
    .custom-div-icon { display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(15,23,42,0.3); font-weight: bold; color: #fff; font-size: 11px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    try {
      var map = L.map('map', { 
        zoomControl: false, 
        attributionControl: false,
        fadeAnimation: true,
        zoomAnimation: true
      }).setView([${region.latitude || 10.2381}, ${region.longitude || 77.4892}], ${region.zoom || 14});
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);

      var bounds = [];

      var route = ${routeJson};
      if (route && route.length > 1) {
        L.polyline(route, { color: '#0284C7', weight: 4, opacity: 0.9, dashArray: '6, 8' }).addTo(map);
        bounds = bounds.concat(route);
      }

      var polygons = ${polygonsJson};
      if (polygons && polygons.length > 0) {
        polygons.forEach(function(poly) {
          if (poly.coords && poly.coords.length > 2) {
            var p = L.polygon(poly.coords, {
              color: poly.color,
              weight: 2,
              fillColor: poly.fillColor,
              fillOpacity: 0.22
            }).addTo(map);
            if (poly.name) {
              p.bindPopup('<strong style="color:#0F172A;">' + poly.name + '</strong>');
            }
            bounds = bounds.concat(poly.coords);
          }
        });
      }

      var markers = ${markersJson};
      if (markers && markers.length > 0) {
        markers.forEach(function (m) {
          if (m.latitude && m.longitude) {
            var color = m.color || '#0284c7';
            var customIcon = L.divIcon({
              className: 'custom-div-icon',
              html: '<div style="background-color:' + color + ';width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:bold;border:2px solid #fff;box-shadow:0 2px 6px rgba(15,23,42,0.3);">' + (m.icon || '📍') + '</div>',
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });

            var marker = L.marker([m.latitude, m.longitude], { icon: customIcon, title: m.title }).addTo(map);
            var popupContent = '<strong style="color:#0F172A;font-size:13px;">' + m.title + '</strong>' + (m.subtitle ? '<br/><span style="color:#64748B;font-size:11px;font-weight:500;">' + m.subtitle + '</span>' : '');
            marker.bindPopup(popupContent);
            bounds.push([m.latitude, m.longitude]);
          }
        });
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }
    } catch (e) {
      console.error(e);
    }
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
  overlayTitle,
  overlayText,
  height = '100%',
}: RealMapProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const html = useMemo(
    () => buildMapHtml({ region, markers, route, polygon, polygons }),
    [region, markers, route, polygon, polygons]
  );

  const isFull = height === '100%' || height === undefined;

  return (
    <View style={[styles.wrapper, isFull && styles.fullWrapper]}>
      <View style={[styles.frame, isFull ? styles.fullFrame : { height: typeof height === 'number' ? height : 360 }]}>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={styles.webview}
          containerStyle={styles.webviewContainer}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          androidHardwareAccelerationDisabled={false}
          onLoadEnd={() => setIsLoaded(true)}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0284C7" />
              <Text style={styles.loadingText}>Loading Safety Map...</Text>
            </View>
          )}
          startInLoadingState={true}
        />
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
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  fullWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 0,
    borderWidth: 0,
  },
  frame: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  fullFrame: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  webview: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  overlay: {
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  overlayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  overlayText: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});
