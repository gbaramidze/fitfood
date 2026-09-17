'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { customerReviews } from '@/data/reviews';
import { IconSparkles, IconStar } from '@/components/Icons';

export const ReviewsSection: React.FC = () => {
  const { locale } = useLanguage();

  return (
    <section className="reviews-section-gf" id="reviews">
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#0F172A',
            color: '#CCFF00',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '12px'
          }}>
            <IconSparkles size={14} />
            <span>
              {locale === 'ru' ? 'РЕАЛЬНЫЕ РЕЗУЛЬТАТЫ' : locale === 'ka' ? 'რეალური შედეგები' : 'REAL RESULTS'}
            </span>
          </div>

          <h2 style={{ fontSize: '38px', fontWeight: 900, color: '#0F172A', marginBottom: '14px', letterSpacing: '-0.02em' }}>
            {locale === 'ru'
              ? 'Более 15 000 человек достигли целей с нами'
              : locale === 'ka'
              ? '15,000+ კმაყოფილი მომხმარებელი'
              : '15,000+ Real Transformations'}
          </h2>

          <p style={{ fontSize: '16px', color: '#64748B' }}>
            {locale === 'ru'
              ? 'Истории наших клиентов, которые сбросили вес и улучшили здоровье на рационах FitFood'
              : locale === 'ka'
              ? 'ჩვენი მომხმარებლების რეალური ისტორიები, რომლებმაც მიაღწიეს სასურველ წონასა და ჯანმრთელობას FitFood-თან ერთად.'
              : 'Real before and after stories of clients achieving optimal body health with FitFood'}
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="reviews-grid-gf">
          {customerReviews.map((rev) => (
            <div key={rev.id} className="review-card-gf">
              <div>
                {/* Before / After Photos */}
                {rev.avatarBefore && rev.avatarAfter && (
                  <div className="review-card-top-photos">
                    <div className="review-photo-item">
                      <img src={rev.avatarBefore} alt={`${rev.name} Before`} />
                      <span className="review-weight-pill">
                        {locale === 'ru' ? 'До' : locale === 'ka' ? 'მანამდე' : 'Before'}: {rev.beforeWeight}
                      </span>
                    </div>
                    <div className="review-photo-item">
                      <img src={rev.avatarAfter} alt={`${rev.name} After`} />
                      <span className="review-weight-pill" style={{ background: '#15803D' }}>
                        {locale === 'ru' ? 'После' : locale === 'ka' ? 'შემდეგ' : 'After'}: {rev.afterWeight}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div className="review-diff-badge">
                    {rev.diffKg}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>
                    {rev.duration}
                  </div>
                </div>

                <div className="review-person-info">
                  {rev.name}
                </div>

                <div className="review-program-tag">
                  {rev.program} • {rev.location}
                </div>

                <p className="review-quote-text">
                  "{rev.text[locale]}"
                </p>
              </div>

              {/* Bottom Stars */}
              <div style={{ display: 'flex', gap: '3px', marginTop: '16px', color: '#EAB308' }}>
                {[...Array(5)].map((_, i) => (
                  <IconStar key={i} size={16} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
