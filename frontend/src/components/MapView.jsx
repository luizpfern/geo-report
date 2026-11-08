import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const TYPE_COLORS = {
  FLOOD: '#3b82f6',
  FIRE: '#ef4444',
  EARTHQUAKE: '#c2410c',
  BLOCKED_ROAD: '#f59e0b',
  TREE_FALL: '#22c55e',
};

const DEFAULT_PIN_COLOR = '#94a3b8';

const iconCache = new Map();

function getTypeIcon(code) {
  const key = code || 'DEFAULT';
  if (iconCache.has(key)) return iconCache.get(key);

  const color = TYPE_COLORS[key] || DEFAULT_PIN_COLOR;
  const icon = L.divIcon({
    className: 'report-pin-icon',
    html: `<span class="report-pin" style="--pin-color:${color}"></span>`,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -28],
  });

  iconCache.set(key, icon);
  return icon;
}

const userIcon = L.divIcon({
  className: 'user-location-icon',
  html: '<span class="user-dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function RecenterOnUser({ center, accuracy, enabled }) {
  const map = useMap();
  const lastKey = useRef('');

  useEffect(() => {
    if (!enabled || !center) return;
    const key = `${center[0].toFixed(5)},${center[1].toFixed(5)},${Math.round(accuracy || 0)}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    if (accuracy && accuracy > 800) {
      const bounds = L.latLng(center[0], center[1]).toBounds(accuracy * 2);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      map.setView(center, Math.max(map.getZoom(), 16), { animate: true });
    }
  }, [center, accuracy, enabled, map]);

  return null;
}

function FlyToTarget({ target }) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lon], 17, { duration: 0.85 });
  }, [target, map]);

  return null;
}

export default function MapView({
  center,
  userLocation,
  accuracy,
  reports,
  followUser,
  focusTarget,
  selectedReportId,
}) {
  const mapCenter = useMemo(() => center || [-21.1704, -47.8103], [center]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={15}
      className="map-view"
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterOnUser center={mapCenter} accuracy={accuracy} enabled={followUser && !focusTarget} />
      <FlyToTarget target={focusTarget} />

      {userLocation && (
        <>
          {accuracy != null && accuracy > 0 && (
            <Circle
              center={[userLocation.lat, userLocation.lon]}
              radius={accuracy}
              pathOptions={{
                color: '#1a73e8',
                fillColor: '#1a73e8',
                fillOpacity: 0.12,
                weight: 1,
              }}
            />
          )}
          <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon}>
            <Popup>
              <strong>Você está aqui</strong>
            </Popup>
          </Marker>
        </>
      )}

      {reports.map((report) => (
        <Marker
          key={report.id}
          position={[report.latitude, report.longitude]}
          icon={getTypeIcon(report.report_type_code)}
          opacity={selectedReportId && selectedReportId !== report.id ? 0.55 : 1}
          zIndexOffset={selectedReportId === report.id ? 1000 : 0}
        >
          <Popup>
            <strong style={{ color: TYPE_COLORS[report.report_type_code] || DEFAULT_PIN_COLOR }}>
              {report.report_type_name || report.report_type_code}
            </strong>
            <br />
            {report.description || 'Sem descrição'}
            <br />
            <small>{new Date(report.created_at).toLocaleString('pt-BR')}</small>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
