// @ts-nocheck
/**
 * AMentorStep0Screen — Mission Briefing step.
 * Immersive HUD interface overlaying the 3D Star Chart.
 */
import React, { Suspense, lazy } from 'react';
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
                <strong>VIRTUALIZING IMPACT...</strong> Mastering this mission grants you a "Master Key" for this sector. 
                Every planet here represents a challenge that becomes significantly easier once you conquer this core logic.
              </p>
            </div>

            {/* Horizontal Legend */}
            <div className="amentor-hud__legend">
              <div className="amentor-hud__legend-item">
                <span className="amentor-hud__dot amentor-hud__dot--core" />
                <span>Identical</span>
              </div>
              <div className="amentor-hud__legend-item">
                <span className="amentor-hud__dot amentor-hud__dot--near" />
                <span>50%+ Logic</span>
              </div>
              <div className="amentor-hud__legend-item">
                <span className="amentor-hud__dot amentor-hud__dot--far" />
                <span>Shared DNA</span>
              </div>
            </div>
          </div>
          <div className="amentor-hud__header-line" />
        </header>

        {/* Compact Side Panel - Sector Analysis */}
        <aside className="amentor-hud__info-panel">
          <div className="amentor-hud__panel-header">SECTOR MAP</div>
          <div className="amentor-hud__panel-body">
            <div className="amentor-hud__layer">
              <div className="amentor-hud__layer-indicator amentor-hud__dot--core" />
              <div className="amentor-hud__layer-info">
                <strong>INNER CORE</strong>
                <span>Identical Logic. Mastering this problem essentially solves these.</span>
              </div>
            </div>
            <div className="amentor-hud__layer">
              <div className="amentor-hud__layer-indicator amentor-hud__dot--near" />
              <div className="amentor-hud__layer-info">
                <strong>MID-RIM</strong>
                <span>50% Heavy Lifting. Today's pattern does half the work for you.</span>
              </div>
            </div>
            <div className="amentor-hud__layer">
              <div className="amentor-hud__layer-indicator amentor-hud__dot--far" />
              <div className="amentor-hud__layer-info">
                <strong>OUTER REACH</strong>
                <span>Pattern DNA. These use parts of today's solution as their base.</span>
              </div>
            </div>
          </div>
          <div className="amentor-hud__scan-line" />
        </aside>

        {/* Bottom Activation Area */}
        <footer className="amentor-hud__footer">
          <div className="amentor-hud__footer-decoration" />
          <button
            className="amentor-hud__action-btn"
            onClick={onComplete}
          >
            <div className="amentor-hud__btn-glare" />
            <span className="amentor-hud__btn-label">INITIATE MISSION</span>
            <span className="amentor-hud__btn-sub">EST. REWARD: 50 XP</span>
          </button>
        </footer>

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
