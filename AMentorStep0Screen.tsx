// @ts-nocheck
/**
 * AMentorStep0Screen — Mission Briefing step.
 * Immersive HUD interface overlaying the 3D Star Chart.
 */
import React, { Suspense, lazy, useState } from 'react';
import type { InitialActivity } from '../../types/amentorV2';
import '../../styles/components/organisms/AMentorStep0Screen.css';

const ProblemNetwork3D = lazy(() => import('../molecules/ProblemNetwork3D'));

interface AMentorStep0ScreenProps {
  initial: InitialActivity;
  title: string;
  onComplete: () => void;
}

const AMentorStep0Screen: React.FC<AMentorStep0ScreenProps> = ({
  initial,
  title,
  onComplete,
}) => {
  const network = initial.network;
  const [hoveredSector, setHoveredSector] = useState<'inner' | 'middle' | 'outer' | null>(null);
  const [hudOpen, setHudOpen] = useState(false);

  return (
    <div className="amentor-hud">
      {/* Background Star Chart */}
      <div className="amentor-hud__canvas-layer">
        {network ? (
          <Suspense fallback={<div className="amentor-hud__loading">INITIALIZING STAR CHART...</div>}>
            <ProblemNetwork3D
              centerProblem={network.centerProblem}
              innerCircleProblems={network.innerCircleProblems || []}
              middleCircleProblems={network.middleCircleProblems || []}
              outerCircleProblems={network.outerCircleProblems || []}
              highlightedOrbit={hoveredSector}
            />
          </Suspense>
        ) : (
          <div className="amentor-hud__no-data">SENSOR DATA UNAVAILABLE</div>
        )}
      </div>

      {/* HUD Overlay Layers */}
      <div className="amentor-hud__overlay">

        {/* Top Header Panel */}
        <header className="amentor-hud__header">
          <div className="amentor-hud__header-content">
            <div className="amentor-hud__title-group">
              <span className="amentor-hud__status-tag">ACTIVE MISSION</span>
              <h1 className="amentor-hud__title">{title}</h1>
              <p className="amentor-hud__directive">
                <strong>VIRTUALIZING IMPACT... </strong>Mastering <strong>{title}</strong> unlocks this entire sector. Every planet here represents a challenge built on the same core logic — conquer this pattern once and the rest become significantly easier.
              </p>
            </div>

            {/* HUD Control Button */}
            <div
              style={{ position: 'relative', alignSelf: 'flex-end' }}
              onMouseEnter={() => setHudOpen(true)}
              onMouseLeave={() => setHudOpen(false)}
            >
              <div style={{
                padding: '8px 14px',
                borderRadius: '0px',
                border: '1px solid rgba(21, 170, 191, 0.5)',
                backgroundColor: 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(21, 170, 191, 0.8)',
                fontWeight: '400',
                fontSize: '11px',
                fontFamily: "'Orbitron', sans-serif",
                letterSpacing: '2px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                HUD CONTROL
              </div>

              {hudOpen && (
                <div style={{
                  position: 'absolute',
                  top: '42px',
                  right: '0',
                  width: '240px',
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  border: '1px solid rgba(21, 170, 191, 0.5)',
                  borderRadius: '0px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  zIndex: 100,
                }}>
                  <div style={{
                    color: 'rgba(21, 170, 191, 0.8)',
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '12px',
                    fontWeight: '400',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid rgba(21, 170, 191, 0.2)',
                    paddingBottom: '8px',
                  }}>
                    CONTROLS
                  </div>
                  {[
                    'Click planets to view details',
                    'Hover zones to highlight patterns',
                    'Click areas to view all sector problems',
                  ].map((tip, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      gap: '8px',
                      color: 'rgba(255, 255, 255, 0.55)',
                      fontSize: '11px',
                      fontFamily: "'Orbitron', sans-serif",
                      fontWeight: '400',
                      letterSpacing: '0.5px',
                      lineHeight: '1.6',
                    }}>
                      <span style={{ color: 'rgba(21, 170, 191, 0.6)', flexShrink: 0 }}>—</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="amentor-hud__header-line" />
        </header>

        {/* ── Bottom Section — Sector Map + Button stacked centered ── */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '0',
          right: '0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          pointerEvents: 'auto',
          zIndex: 20,
        }}>
          {/* Sector Map Bar */}
          <div style={{
            display: 'flex',
            borderTop: '1px solid rgba(21, 170, 191, 0.15)',
            borderBottom: '1px solid rgba(21, 170, 191, 0.15)',
            overflow: 'hidden',
          }}>
            {[
              { key: 'inner', label: 'INNER CORE', desc: 'Once you crack this, these problems are basically already solved.', color: '#3b82f6' },
              { key: 'middle', label: 'MID-RIM', desc: 'This pattern carries you halfway through these problems automatically.', color: '#f59e0b' },
              { key: 'outer', label: 'OUTER REACH', desc: 'These problems borrow pieces of this solution as their foundation.', color: '#8b5cf6' },
            ].map((sector, i) => (
              <div
                key={sector.key}
                onMouseEnter={() => setHoveredSector(sector.key as any)}
                onMouseLeave={() => setHoveredSector(null)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 18px',
                  cursor: 'pointer',
                  borderRight: i < 2 ? '1px solid rgba(21, 170, 191, 0.15)' : 'none',
                  backgroundColor: hoveredSector === sector.key
                    ? 'rgba(21, 170, 191, 0.06)'
                    : 'rgba(0, 0, 0, 0.3)',
                  transition: 'background 0.2s ease',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: sector.color,
                  boxShadow: hoveredSector === sector.key
                    ? `0 0 14px ${sector.color}, 0 0 28px ${sector.color}`
                    : `0 0 4px ${sector.color}`,
                  flexShrink: 0,
                  marginTop: '4px',
                  transition: 'box-shadow 0.2s ease',
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '2px',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                  }}>
                    {sector.label}
                  </span>
                  <span style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '9px',
                    letterSpacing: '0.5px',
                    lineHeight: '1.6',
                    color: hoveredSector === sector.key
                      ? sector.color
                      : 'rgba(255, 255, 255, 0.4)',
                    transition: 'color 0.2s ease',
                    maxWidth: '160px',
                  }}>
                    {sector.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Initiate Mission Button */}
          <button
            className="amentor-hud__action-btn"
            onClick={onComplete}
          >
            <div style={{ position: 'absolute', bottom: -2, left: -2, width: 12, height: 12, borderBottom: '2px solid #15AABF', borderLeft: '2px solid #15AABF' }} />
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderBottom: '2px solid #15AABF', borderRight: '2px solid #15AABF' }} />
            <span className="amentor-hud__btn-label">INITIATE MISSION</span>
            <span className="amentor-hud__btn-sub">EST. REWARD: 50 XP</span>
          </button>
        </div>

        {/* Decorative HUD Elements */}
        <div className="amentor-hud__corner amentor-hud__corner--tl" />
        <div className="amentor-hud__corner amentor-hud__corner--tr" />
        <div className="amentor-hud__corner amentor-hud__corner--bl" />
        <div className="amentor-hud__corner amentor-hud__corner--br" />
      </div>
    </div>
  );
};

export default AMentorStep0Screen;