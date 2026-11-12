'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Crosshair, Loader2, MapPin, Maximize2, Navigation } from 'lucide-react';
import type * as LType from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Locale } from '@/types';
import { T } from './orderData';

export interface PickedPoint {
  lat: number;
  lng: number;
  /** street and house, as the map resolved them (the customer can edit it) */
  address: string;
}

interface Props {
  locale: Locale;
  value: { lat: number; lng: number } | null;
  onPick: (p: PickedPoint) => void;
  /** the address found for the pin, shown in the full-screen bar */
  address?: string;
}

// Batumi centre; the pin appears only after the customer taps the map, drags it or presses "Where am I"
const BATUMI = { lat: 41.6434, lng: 41.6399 };

const PIN_HTML = `
  <div style="position:relative;width:38px;height:38px">
    <div style="position:absolute;left:3px;top:0;width:32px;height:32px;background:#ccff00;border:2.5px solid #0b0f19;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 14px rgba(0,0,0,.45)"></div>
    <div style="position:absolute;left:13.5px;top:10px;width:11px;height:11px;background:#0b0f19;border-radius:50%"></div>
  </div>`;

/** The same Leaflet + OpenStreetMap picker the Royal Salmon shop uses: tap, drag the pin, or locate yourself. */
export function DeliveryMap({ locale: l, value, onPick, address = '' }: Props) {
  const view = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LType.Map | null>(null);
  const marker = useRef<LType.Marker | null>(null);
  const leaflet = useRef<typeof LType | null>(null);
  const pick = useRef(onPick);
  pick.current = onPick;

  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gpsFailed, setGpsFailed] = useState(false);
  const [full, setFull] = useState(false);

  // full screen: lock the page scroll, close on Escape, and let Leaflet re-measure the bigger box
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFull(false);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [full]);
  // A card above the map has an animation, which would make "fixed" relative to the card instead of the screen.
  // So in full-screen the map box is moved up to the page root (still inside the order styles) and put back afterwards.
  useEffect(() => {
    const el = view.current;
    if (!full || !el || !el.parentNode) return;
    const home = document.createComment('map');
    el.parentNode.insertBefore(home, el);
    (el.closest('.ord-root') ?? document.body).appendChild(el);
    return () => {
      home.parentNode?.insertBefore(el, home);
      home.remove();
    };
  }, [full]);
  useEffect(() => {
    const t = setTimeout(() => {
      map.current?.invalidateSize();
      if (marker.current) map.current?.panTo(marker.current.getLatLng());
    }, 60);
    return () => clearTimeout(t);
  }, [full]);

  /** street + house for a point (OpenStreetMap Nominatim) */
  const resolve = useCallback(async (lat: number, lng: number) => {
    setResolving(true);
    let address = '';
    try {
      const langs = l === 'ka' ? 'ka,ru,en' : l === 'ru' ? 'ru,ka,en' : 'en,ka,ru';
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=${langs}`
      );
      if (res.ok) {
        const data = await res.json();
        const a = data.address || {};
        const road = a.road || a.pedestrian || a.street || a.neighbourhood || '';
        const house = a.house_number || '';
        address = road && house ? `${road}, ${house}` : road || a.suburb || a.city_district || '';
      }
    } catch {
      /* offline or rate-limited: the customer types the address, the pin is what counts */
    }
    setResolving(false);
    pick.current({ lat, lng, address });
  }, [l]);

  const place = useCallback((lat: number, lng: number, fly = false) => {
    if (!map.current || !leaflet.current) return;
    if (!marker.current) {
      const L = leaflet.current;
      const m = L.marker([lat, lng], {
        draggable: true,
        icon: L.divIcon({ html: PIN_HTML, className: 'fit-map-pin', iconSize: [38, 38], iconAnchor: [19, 36] }),
      }).addTo(map.current);
      m.on('dragend', () => {
        const p = m.getLatLng();
        resolve(p.lat, p.lng);
      });
      marker.current = m;
    } else {
      marker.current.setLatLng([lat, lng]);
    }
    if (fly) map.current.flyTo([lat, lng], 16, { duration: 1 });
    resolve(lat, lng);
  }, [resolve]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!box.current || map.current) return;
      const L = await import('leaflet');
      if (cancelled || !box.current) return;
      leaflet.current = L;
      const m = L.map(box.current, { center: [value?.lat ?? BATUMI.lat, value?.lng ?? BATUMI.lng], zoom: value ? 16 : 13, zoomControl: false });
      m.attributionControl?.setPrefix(false);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(m);
      L.control.zoom({ position: 'topright' }).addTo(m);
      m.on('click', (e: LType.LeafletMouseEvent) => place(e.latlng.lat, e.latlng.lng));
      map.current = m;
      if (value) {
        // restore the pin without asking the geocoder again
        const mk = L.marker([value.lat, value.lng], {
          draggable: true,
          icon: L.divIcon({ html: PIN_HTML, className: 'fit-map-pin', iconSize: [38, 38], iconAnchor: [19, 36] }),
        }).addTo(m);
        mk.on('dragend', () => {
          const p = mk.getLatLng();
          resolve(p.lat, p.lng);
        });
        marker.current = mk;
      }
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locate = () => {
    setGpsFailed(false);
    if (!navigator.geolocation) { setGpsFailed(true); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      p => { setLocating(false); place(p.coords.latitude, p.coords.longitude, true); },
      () => { setLocating(false); setGpsFailed(true); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="fit-map">
      <div ref={view} className={`fit-map-view${full ? ' full' : ''}`}>
        <div ref={box} className="fit-map-canvas" />
        <div className="fit-map-hint"><Navigation size={12} /> {T.mapHint[l]}</div>
        {!full && (
          <button type="button" className="fit-map-expand" onClick={() => setFull(true)} aria-label={T.mapExpand[l]}>
            <Maximize2 size={15} /> <span>{T.mapExpand[l]}</span>
          </button>
        )}
        <button type="button" className="fit-map-locate" onClick={locate} disabled={locating}>
          {locating ? <Loader2 size={15} className="fit-spin" /> : <Crosshair size={15} />} {T.mapLocate[l]}
        </button>
        {full && (
          <div className="fit-map-fullbar">
            <div className="fit-map-fulladdr">
              <MapPin size={16} />
              <span>{resolving ? T.mapResolving[l] : address || (value ? T.mapPinned[l] : T.pickOnMap[l])}</span>
            </div>
            <button type="button" className="ord-cta" onClick={() => setFull(false)}><Check size={17} /> {T.mapDone[l]}</button>
          </div>
        )}
      </div>
      {gpsFailed && <p className="ord-warn" style={{ marginTop: 8 }}>{T.mapGpsFail[l]}</p>}
      <div className={`fit-map-status${value ? ' ok' : ''}`}>
        <MapPin size={15} />
        <span>{resolving ? T.mapResolving[l] : value ? T.mapPinned[l] : T.pickOnMap[l]}</span>
      </div>
    </div>
  );
}
