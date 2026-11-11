'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { Dish, Locale } from '@/types';
import { DISH_VIDEOS, videoSrc } from '@/lib/rationDishesService';
import { T } from './orderData';

/**
 * One featured player + a selector with the dishes that have a cooking film.
 * Only the selected film is loaded (the files are large); everything else is just a card.
 */
export function SignatureFilms({ locale, dishes, onOrder }: { locale: Locale; dishes: Dish[]; onOrder: () => void }) {
  const items = Object.keys(DISH_VIDEOS)
    .map(slug => dishes.find(d => d.slug === slug))
    .filter((d): d is Dish => Boolean(d));

  const [active, setActive] = useState(0);
  const [portrait, setPortrait] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const on = () => setPortrait(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // play only while the player is on screen
  useEffect(() => {
    const el = wrapRef.current;
    const v = videoRef.current;
    if (!el || !v || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [active, portrait, items.length]);

  if (!items.length) return null;
  const dish = items[Math.min(active, items.length - 1)];
  const src = videoSrc(dish.slug, portrait);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  return (
    <section className="ord-films" id="films">
      <div className="ord-sec-head">
        <span className="ord-kicker"><i />{T.filmsKicker[locale]}</span>
        <h2>{T.filmsTitle[locale]}</h2>
        <p>{T.filmsSub[locale]}</p>
      </div>

      <div className="ord-showcase">
        <div className="ord-stage" ref={wrapRef}>
          {src && (
            <video
              key={src}
              ref={videoRef}
              src={src}
              muted loop playsInline preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              aria-label={dish.name[locale]}
            />
          )}
          <div className="ord-stage-cap">
            <div>
              <b>{dish.name[locale]}</b>
              <div className="ord-macros">
                <span>{dish.macros.calories} {T.kcal[locale]}</span>
                <span>{T.protein[locale]} {dish.macros.protein}</span>
                <span>{T.fat[locale]} {dish.macros.fat}</span>
                <span>{T.carbs[locale]} {dish.macros.carbs}</span>
              </div>
            </div>
            <button type="button" className="ord-film-btn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>
        </div>

        <div className="ord-picker" role="tablist" aria-label={T.filmsTitle[locale]}>
          {items.map((d, i) => (
            <button
              key={d.id} type="button" role="tab" aria-selected={i === active}
              className={`ord-pick ${i === active ? 'on' : ''}`}
              onClick={() => setActive(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.image} alt="" loading="lazy" />
              <span>
                <b>{DISH_VIDEOS[d.slug].title}</b>
                <small>{d.name[locale]} · {d.macros.calories} {T.kcal[locale]}</small>
              </span>
              <Play size={14} />
            </button>
          ))}
          <button type="button" className="ord-cta" style={{ marginTop: 6, justifyContent: 'center' }} onClick={onOrder}>
            {T.toRation[locale]} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
