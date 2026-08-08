import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { X, MapPin, Maximize2, Minimize2, Navigation, Loader2, AlertTriangle } from 'lucide-react';

// Importação inline do CSS do Leaflet para evitar problemas com bundlers
const LEAFLET_CSS = `
  .leaflet-container { font-family: inherit; }
  .leaflet-control-attribution { font-size: 10px; }
  .leaflet-popup-content-wrapper { border-radius: 16px; padding: 0; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35); }
  .leaflet-popup-content { margin: 0; }
  .leaflet-popup-tip-container { display: none; }
  .leaflet-marker-icon { filter: drop-shadow(0 4px 12px rgba(16,185,129,0.5)); }
`;

function injectLeafletCSS() {
  if (document.getElementById('leaflet-map-css')) return;
  const link = document.createElement('link');
  link.id = 'leaflet-map-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
  const style = document.createElement('style');
  style.textContent = LEAFLET_CSS;
  document.head.appendChild(style);
}

/**
 * MapModal — Modal com mapa interativo Leaflet para agendamentos à domicílio.
 *
 * Props:
 *  - open         {boolean}  — controla visibilidade
 *  - onClose      {Function} — callback ao fechar
 *  - endereco     {object|string} — endereço do cliente (objeto {rua, numero, bairro, complemento} ou string)
 *  - clienteNome  {string}   — nome do cliente
 *  - googleMapsUrl {string}  — URL do Google Maps para fallback
 */
export function MapModal({ open, onClose, endereco, clienteNome, googleMapsUrl }) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [coords, setCoords] = useState(null);

  // Formata o endereço para texto de geocodificação
  function buildAddressString(end) {
    if (!end) return '';
    if (typeof end === 'string') {
      try {
        const parsed = JSON.parse(end);
        if (typeof parsed === 'object' && parsed !== null) {
          return [parsed.rua, parsed.numero, parsed.bairro, 'Brasil'].filter(Boolean).join(', ');
        }
      } catch (e) {}
      return end;
    }
    if (typeof end === 'object') {
      return [end.rua, end.numero, end.bairro, 'Brasil'].filter(Boolean).join(', ');
    }
    return '';
  }

  // Formata o endereço para exibição no popup
  function buildAddressDisplay(end) {
    if (!end) return 'Endereço do cliente';
    if (typeof end === 'string') {
      try {
        const parsed = JSON.parse(end);
        if (typeof parsed === 'object' && parsed !== null) end = parsed;
      } catch (e) {
        return end;
      }
    }
    if (typeof end === 'object') {
      return [
        end.rua && end.numero ? `${end.rua}, ${end.numero}` : end.rua || '',
        end.bairro ? `Bairro ${end.bairro}` : '',
        end.complemento || ''
      ].filter(Boolean).join(' — ');
    }
    return String(end);
  }

  // Geocodificação via Nominatim (OSM, gratuito, sem API key)
  async function geocodeAddress(addressStr) {
    if (!addressStr) return null;
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addressStr)}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR,pt' } });
    if (!res.ok) throw new Error('Erro na geocodificação');
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  }

  // Monta o mapa com Leaflet após geocodificação
  async function initMap(coords) {
    if (!mapContainerRef.current) return;

    // Importação dinâmica do Leaflet
    const L = await import('leaflet');

    // Remove mapa anterior se existir
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lon],
      zoom: 16,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Ícone customizado com cor do sistema
    const icon = L.divIcon({
      className: '',
      html: `
        <div style="
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 20px rgba(16,185,129,0.5);
          border: 3px solid white;
          display: flex; align-items: center; justify-content: center;
        ">
          <div style="transform: rotate(45deg); color: white; font-size: 16px;">📍</div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -44],
    });

    const popupContent = `
      <div style="padding: 12px 16px; min-width: 180px;">
        <div style="font-size: 12px; font-weight: 900; color: #10b981; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 4px;">🏠 Domicílio</div>
        <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${clienteNome || 'Cliente'}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${buildAddressDisplay(endereco)}</div>
      </div>
    `;

    L.marker([coords.lat, coords.lon], { icon })
      .addTo(map)
      .bindPopup(popupContent, { maxWidth: 260 })
      .openPopup();

    mapInstanceRef.current = map;

    // Forçar re-layout para o mapa renderizar corretamente
    setTimeout(() => map.invalidateSize(), 100);
  }

  // Efeito principal: abre o modal e geocodifica
  useEffect(() => {
    if (!open) {
      setExpanded(false);
      setCoords(null);
      setGeocodeStatus('idle');
      return;
    }

    injectLeafletCSS();

    // Animação de entrada
    if (overlayRef.current && modalRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      gsap.fromTo(modalRef.current, { scale: 0.92, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.4)', delay: 0.05 });
    }

    // Geocodificar o endereço
    setGeocodeStatus('loading');
    const addrStr = buildAddressString(endereco);
    if (!addrStr) {
      setGeocodeStatus('error');
      return;
    }

    geocodeAddress(addrStr)
      .then((result) => {
        if (result) {
          setCoords(result);
          setGeocodeStatus('success');
        } else {
          setGeocodeStatus('error');
        }
      })
      .catch(() => setGeocodeStatus('error'));
  }, [open, endereco]);

  // Inicia o mapa quando as coordenadas estão prontas
  useEffect(() => {
    if (geocodeStatus === 'success' && coords && open) {
      // Pequeno delay para garantir que o container está renderizado
      setTimeout(() => initMap(coords), 150);
    }
  }, [geocodeStatus, coords, open, expanded]);

  // Reinvalidar o mapa ao expandir/contrair
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
    }
  }, [expanded]);

  // Fechar com ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  function handleClose() {
    if (!overlayRef.current || !modalRef.current) { onClose(); return; }
    gsap.to(modalRef.current, { scale: 0.94, opacity: 0, y: 10, duration: 0.2, ease: 'power2.in', onComplete: onClose });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in' });
  }

  function handleToggleExpand() {
    setExpanded(prev => !prev);
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4 backdrop-blur-md"
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0, transform: 'none' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        ref={modalRef}
        className={`relative overflow-hidden rounded-t-[2.2rem] sm:rounded-[2.2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 flex flex-col transition-all duration-300 pb-safe-bottom ${
          expanded
            ? 'w-screen h-screen max-w-none rounded-none'
            : 'w-full max-w-2xl max-h-[88dvh]'
        }`}
        style={expanded ? { borderRadius: 0 } : {}}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-extrabold uppercase tracking-widest text-emerald-500">Atendimento Domiciliar</span>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight truncate">
                {clienteNome || 'Cliente'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Expandir/Minimizar */}
            <button
              onClick={handleToggleExpand}
              title={expanded ? 'Tamanho normal' : 'Expandir mapa'}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-all"
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            {/* Fechar */}
            <button
              onClick={handleClose}
              title="Fechar"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Endereço text */}
        <div className="px-5 py-3 bg-emerald-50/60 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30 shrink-0">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-snug">
            📍 {buildAddressDisplay(endereco)}
          </p>
        </div>

        {/* Mapa ou estado de loading/erro */}
        <div className={`relative flex-1 ${expanded ? 'min-h-0' : 'h-[420px]'}`}>
          {/* Loading */}
          {geocodeStatus === 'loading' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                <Loader2 className="h-7 w-7 text-emerald-500 animate-spin" />
              </div>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Localizando endereço...</span>
            </div>
          )}

          {/* Erro de geocodificação */}
          {geocodeStatus === 'error' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4 px-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
                <AlertTriangle className="h-7 w-7 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1">Não foi possível localizar o endereço no mapa</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">O endereço pode estar incompleto ou fora de cobertura do OpenStreetMap.</p>
              </div>
              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-opacity"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Buscar no Google Maps
                </a>
              )}
            </div>
          )}

          {/* Container do mapa Leaflet */}
          <div
            ref={mapContainerRef}
            className="w-full h-full bg-slate-100 dark:bg-slate-800"
            style={{ minHeight: expanded ? '100%' : 420 }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 px-5 py-4 shrink-0">
          {googleMapsUrl ? (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-black text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all"
            >
              <Navigation className="h-3.5 w-3.5" />
              Abrir no Google Maps
            </a>
          ) : <div />}
          <button
            onClick={handleClose}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all"
          >
            <X className="h-3.5 w-3.5" />
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
