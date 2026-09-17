'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useStore } from '@/context/StoreContext';
import {
  IconHome,
  IconSparkles,
  IconChef,
  IconFlame,
  IconShield,
  IconHelpCircle,
  IconPhone,
  IconArrowRight
} from '@/components/Icons';

export default function NotFound() {
  const { t } = useLanguage();
  const { setIsQuizOpen } = useStore();

  const nf = t.notFound;

  return (
    <main style={{
      minHeight: '85vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '60px 16px 90px',
      background: 'linear-gradient(180deg, #0B1120 0%, #0F172A 50%, #090D16 100%)',
      color: '#FFFFFF'
    }}>
      {/* Decorative Glow Orbs */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(204, 255, 0, 0.12) 0%, rgba(16, 185, 129, 0.05) 50%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: '820px', textAlign: 'center' }}>
        
        {/* Status Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          padding: '6px 16px',
          borderRadius: '9999px',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: '#CCFF00',
          marginBottom: '20px'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#CCFF00', display: 'inline-block', boxShadow: '0 0 10px #CCFF00' }} />
          <span>{nf.badge}</span>
        </div>

        {/* 404 Large Number */}
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(80px, 16vw, 150px)',
          fontWeight: 900,
          lineHeight: 0.95,
          letterSpacing: '-0.04em',
          background: 'linear-gradient(180deg, #FFFFFF 30%, rgba(204, 255, 0, 0.8) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '16px',
          textShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
        }}>
          404
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(22px, 3.5vw, 32px)',
          fontWeight: 800,
          color: '#FFFFFF',
          marginBottom: '14px',
          lineHeight: 1.25
        }}>
          {nf.title}
        </h1>

        {/* Description */}
        <p style={{
          fontSize: 'clamp(14px, 1.6vw, 16px)',
          color: '#94A3B8',
          maxWidth: '600px',
          margin: '0 auto 32px',
          lineHeight: 1.6
        }}>
          {nf.description}
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '48px'
        }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: '#CCFF00',
              color: '#0F172A',
              padding: '14px 28px',
              borderRadius: '9999px',
              fontWeight: 800,
              fontSize: '15px',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 8px 24px rgba(204, 255, 0, 0.25)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(204, 255, 0, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(204, 255, 0, 0.25)';
            }}
          >
            <IconHome size={18} />
            <span>{nf.homeBtn}</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsQuizOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              padding: '14px 24px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <IconSparkles size={18} style={{ color: '#CCFF00' }} />
            <span>{nf.quizBtn}</span>
          </button>

          <Link
            href="/#menu"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#CBD5E1',
              padding: '14px 22px',
              borderRadius: '9999px',
              fontWeight: 600,
              fontSize: '14.5px',
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#CBD5E1';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            <IconChef size={18} />
            <span>{nf.menuBtn}</span>
          </Link>
        </div>

        {/* Quick Explore Section */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '28px 24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          textAlign: 'left'
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#94A3B8',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)' }} />
            <span>{nf.exploreTitle}</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px'
          }}>
            {/* Link 1: Programs */}
            <Link
              href="/#programs"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(204, 255, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(204, 255, 0, 0.15)',
                color: '#CCFF00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IconFlame size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{nf.links.programs}</span>
                  <IconArrowRight size={14} style={{ opacity: 0.6 }} />
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', lineHeight: 1.4 }}>
                  {nf.links.programsDesc}
                </div>
              </div>
            </Link>

            {/* Link 2: Quality */}
            <Link
              href="/quality"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IconShield size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{nf.links.quality}</span>
                  <IconArrowRight size={14} style={{ opacity: 0.6 }} />
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', lineHeight: 1.4 }}>
                  {nf.links.qualityDesc}
                </div>
              </div>
            </Link>

            {/* Link 3: FAQ */}
            <Link
              href="/faq"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IconHelpCircle size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{nf.links.faq}</span>
                  <IconArrowRight size={14} style={{ opacity: 0.6 }} />
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', lineHeight: 1.4 }}>
                  {nf.links.faqDesc}
                </div>
              </div>
            </Link>

            {/* Link 4: Contacts */}
            <Link
              href="/contacts"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IconPhone size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{nf.links.contacts}</span>
                  <IconArrowRight size={14} style={{ opacity: 0.6 }} />
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', lineHeight: 1.4 }}>
                  {nf.links.contactsDesc}
                </div>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
