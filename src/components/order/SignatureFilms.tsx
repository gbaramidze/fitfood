'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Locale } from '@/types';
import { T } from './orderData';

const FILMS = ['Italian Balance', 'Tuna Energy', 'hake royale', 'mexican balance'];
const title = (n: string) => n.replace(/\b\w/g, c => c.toUpperCase());
const src = (n: string, portrait: boolean) => `/video/${encodeURIComponent(`${n} ${portrait ? '9x16' : '16x9'}.mov`)}`;

function Film({ name, portrait }: { name: string; portrait: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  // Only the film that is on screen plays — the files are large, so the rest stay paused.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [portrait]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  return (
    <div className="ord-film">
      <video
        ref={ref}
        key={portrait ? 'p' : 'l'}
        src={src(name, portrait)}
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        aria-label={title(name)}
      />
      <div className="ord-film-cap">
        <b>{title(name)}</b>
        <button type="button" className="ord-film-btn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
      </div>
    </div>
  );
}

export function SignatureFilms({ locale }: { locale: Locale }) {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const on = () => setPortrait(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  return (
    <section className="ord-films" id="films">
      <div className="ord-sec-head">
        <span className="ord-kicker"><i />{T.filmsKicker[locale]}</span>
        <h2>{T.filmsTitle[locale]}</h2>
        <p>{T.filmsSub[locale]}</p>
      </div>
      <div className="ord-film-grid">
        {FILMS.map(n => (
          <Film key={n} name={n} portrait={portrait} />
        ))}
      </div>
    </section>
  );
}
