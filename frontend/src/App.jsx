import { useCallback, useEffect, useRef, useState } from 'react';
import MapView from './components/MapView.jsx';
import ReportModal from './components/ReportModal.jsx';
import AlertsDrawer from './components/AlertsDrawer.jsx';
import { fetchReports } from './services/api';

const FALLBACK_CENTER = [-21.1704, -47.8103];
const MAX_GOOD_ACCURACY_M = 100;
const REPORTS_RADIUS_KM = 100;
const POLL_MS = 10000;

function isGoodAccuracy(meters) {
  return typeof meters === 'number' && meters > 0 && meters <= MAX_GOOD_ACCURACY_M;
}

function getPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização indisponível'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
      ...options,
    });
  });
}

export default function App() {
  const [mapCenter, setMapCenter] = useState(FALLBACK_CENTER);
  const [userLocation, setUserLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [reports, setReports] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locatingMe, setLocatingMe] = useState(false);
  const [gpsBlocked, setGpsBlocked] = useState(false);
  const [toast, setToast] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [followUser, setFollowUser] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const userLocationRef = useRef(null);

  const showToast = useCallback((message, tone = 'info') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const loadReports = useCallback(async (lat, lon) => {
    const queryLat = lat ?? FALLBACK_CENTER[0];
    const queryLon = lon ?? FALLBACK_CENTER[1];
    try {
      const data = await fetchReports(queryLat, queryLon, REPORTS_RADIUS_KM);
      setReports(data);
      setAlertCount(data.length);
    } catch {
      // silencioso no HUD
    }
  }, []);

  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  useEffect(() => {
    getPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 })
      .then((pos) => {
        const next = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        setMapCenter([next.lat, next.lon]);
        setUserLocation(next);
        setAccuracy(pos.coords.accuracy ?? null);
        setGpsBlocked(!isGoodAccuracy(pos.coords.accuracy));
        setFollowUser(true);
        loadReports(next.lat, next.lon);
      })
      .catch(() => {
        setGpsBlocked(true);
        loadReports(FALLBACK_CENTER[0], FALLBACK_CENTER[1]);
      });
  }, [loadReports]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const loc = userLocationRef.current;
      loadReports(loc?.lat, loc?.lon);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [loadReports]);

  async function handleRefreshReports() {
    setRefreshing(true);
    const loc = userLocationRef.current;
    await loadReports(loc?.lat, loc?.lon);
    setRefreshing(false);
  }

  async function handleOpenModal() {
    setLocating(true);
    setGpsBlocked(false);

    try {
      const pos = await getPosition({
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      });

      const next = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      };
      const acc = pos.coords.accuracy ?? null;

      setUserLocation(next);
      setAccuracy(acc);
      setMapCenter([next.lat, next.lon]);
      setFollowUser(true);

      if (!isGoodAccuracy(acc)) {
        setGpsBlocked(true);
        showToast('GPS impreciso. Não é possível registrar agora.', 'warn');
        return;
      }

      setGpsBlocked(false);
      setModalOpen(true);
    } catch {
      setGpsBlocked(true);
      showToast('GPS impreciso ou indisponível. Não é possível registrar.', 'warn');
    } finally {
      setLocating(false);
    }
  }

  function handleSelectReport(report) {
    setSelectedReportId(report.id);
    setFollowUser(false);
    setFocusTarget({
      lat: report.latitude,
      lon: report.longitude,
      id: report.id,
      ts: Date.now(),
    });
    setDrawerOpen(false);
  }

  async function handleGoToMe() {
    setLocatingMe(true);

    try {
      const pos = await getPosition({
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      });

      const next = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      };
      const acc = pos.coords.accuracy ?? null;

      setUserLocation(next);
      setAccuracy(acc);
      setMapCenter([next.lat, next.lon]);
      setSelectedReportId(null);
      setFollowUser(false);
      setFocusTarget({
        lat: next.lat,
        lon: next.lon,
        id: 'me',
        ts: Date.now(),
      });
      setGpsBlocked(!isGoodAccuracy(acc));
      loadReports(next.lat, next.lon);
    } catch {
      setGpsBlocked(true);
      showToast('Não foi possível obter sua localização.', 'warn');
    } finally {
      setLocatingMe(false);
    }
  }

  return (
    <div className="app">
      <div className="map-stage">
        <MapView
          center={mapCenter}
          userLocation={userLocation}
          accuracy={accuracy}
          reports={reports}
          followUser={followUser}
          focusTarget={focusTarget}
          selectedReportId={selectedReportId}
        />

        <header className="hud-top">
          <div className="brand-block">
            <span className="brand-mark" aria-hidden="true" />
            <div>
              <h1 className="brand-name">EcoPulse</h1>
              <p className="brand-tag">Alertas urbanos ao vivo</p>
            </div>
          </div>
          <button
            type="button"
            className="count-chip count-chip-btn"
            title="Ver lista de alertas"
            onClick={() => setDrawerOpen(true)}
          >
            <span className="count-num">{alertCount}</span>
            <span className="count-label">alertas</span>
          </button>
        </header>

        <div className="hud-mid">
          {gpsBlocked && (
            <div className="hint-chip warn">
              GPS impreciso. Registro disponível só com localização precisa.
            </div>
          )}
        </div>

        <div className="hud-actions">
          <button
            type="button"
            className={`locate-fab${refreshing ? ' is-spin' : ''}`}
            onClick={handleRefreshReports}
            disabled={refreshing}
            aria-label="Recarregar alertas"
            title="Recarregar alertas"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
              <path
                d="M20 12a8 8 0 1 1-2.2-5.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M20 4v5h-5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            className={`locate-fab${locatingMe ? ' is-spin' : ''}`}
            onClick={handleGoToMe}
            disabled={locatingMe || locating}
            aria-label="Ir para minha localização"
            title="Ir para minha localização"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>

          <button
            type="button"
            className={`register-fab ${!gpsBlocked && userLocation && isGoodAccuracy(accuracy) ? 'ready' : 'locked'}`}
            onClick={handleOpenModal}
            disabled={locating || locatingMe}
          >
            <span className="fab-plus" aria-hidden="true">
              +
            </span>
            <span className="fab-label">
              {locating ? 'Verificando GPS…' : 'Registrar alerta'}
            </span>
          </button>
        </div>
      </div>

      {toast && (
        <div className={`app-toast tone-${toast.tone}`} role="status">
          {toast.message}
        </div>
      )}

      <AlertsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        reports={reports}
        selectedId={selectedReportId}
        onSelect={handleSelectReport}
      />

      <ReportModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        coords={userLocation}
        onSuccess={() => {
          showToast('Alerta enviado para processamento', 'ok');
          setTimeout(() => {
            if (userLocation) {
              loadReports(userLocation.lat, userLocation.lon);
            }
          }, 800);
        }}
      />
    </div>
  );
}
