// @ts-nocheck
/**
 * AMentorPage — Main page orchestrating the AMentor V2 gamified roadmap flow.
 * Supports a mock/preview mode (no auth, no Redux) via ?preview=1 or when
 * the Redux session has no problemId to bootstrap from.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import {
  bootstrapAMentorSession,
  loadBucket,
  submitAnswer,
  fetchHint,
  evaluateCode,
  completeStep0,
  setActiveCheckpoint,
  resetStep0,
  resetSession,
  selectAMentorSession,
  advanceActivityAndRecord,
  recordSessionEvent,
} from '../redux/slices/amentorSlice';

import AMentorTopBar from '../components/molecules/AMentorTopBar';
import AMentorStep0Screen from '../components/organisms/AMentorStep0Screen';
import AMentorRoadmap from '../components/organisms/AMentorRoadmap';
import AMentorCheckpointDetail from '../components/organisms/AMentorCheckpointDetail';
import AMentorEvaluation from '../components/organisms/AMentorEvaluation';
import AMentorVictory from '../components/molecules/AMentorVictory';

import '../styles/pages/AMentorPage.css';

// ─── Mock data ───────────────────────────────────────────────

const MOCK_ROADMAP = [
  { bucket: 'STEP_0_INITIAL',    bucket_index: 0, activity_count: 1 },
  { bucket: 'STEP_1_APPROACH',   bucket_index: 1, activity_count: 3 },
  { bucket: 'STEP_2_VARIANT',    bucket_index: 2, activity_count: 2 },
  { bucket: 'STEP_3_MECHANICS',  bucket_index: 3, activity_count: 4 },
  { bucket: 'STEP_4_EDGE_CASES', bucket_index: 4, activity_count: 2 },
];

const MOCK_CHECKPOINTS = {
  STEP_0_INITIAL:    { bucket: 'STEP_0_INITIAL',    status: 'completed', activityCount: 1, activities: [], currentActivityIndex: 0, label: 'Briefing'   },
  STEP_1_APPROACH:   { bucket: 'STEP_1_APPROACH',   status: 'active',    activityCount: 3, activities: [], currentActivityIndex: 0, label: 'Approach'   },
  STEP_2_VARIANT:    { bucket: 'STEP_2_VARIANT',    status: 'available', activityCount: 2, activities: [], currentActivityIndex: 0, label: 'Variant'    },
  STEP_3_MECHANICS:  { bucket: 'STEP_3_MECHANICS',  status: 'locked',    activityCount: 4, activities: [], currentActivityIndex: 0, label: 'Mechanics'  },
  STEP_4_EDGE_CASES: { bucket: 'STEP_4_EDGE_CASES', status: 'locked',    activityCount: 2, activities: [], currentActivityIndex: 0, label: 'Edge Cases' },
};

const MOCK_INITIAL = {
  type: 'INITIAL',
  network: {
    centerProblem: {
      id: 'two-sum',
      name: 'Two Sum',
      difficulty: 'Easy',
      category: 'Arrays & Hashing',
      solved: false,
      url: 'https://leetcode.com/problems/two-sum/',
    },
    innerCircleProblems: [
      { id: 'valid-anagram',       name: 'Valid Anagram',       difficulty: 'Easy',   category: 'Arrays & Hashing', solved: false, url: '' },
      { id: 'contains-duplicate',  name: 'Contains Duplicate',  difficulty: 'Easy',   category: 'Arrays & Hashing', solved: false, url: '' },
      { id: 'two-sum-ii',          name: 'Two Sum II',          difficulty: 'Medium', category: 'Two Pointers',     solved: false, url: '' },
      { id: '3sum',                name: '3Sum',                difficulty: 'Medium', category: 'Two Pointers',     solved: false, url: '' },
    ],
    middleCircleProblems: [
      { id: 'group-anagrams',         name: 'Group Anagrams',         difficulty: 'Medium', category: 'Arrays & Hashing', solved: false, url: '' },
      { id: 'subarray-sum-equals-k',  name: 'Subarray Sum Equals K',  difficulty: 'Medium', category: 'Prefix Sum',       solved: false, url: '' },
      { id: 'top-k-frequent',         name: 'Top K Frequent',         difficulty: 'Medium', category: 'Heap',             solved: false, url: '' },
    ],
    outerCircleProblems: [
      { id: '4sum',                name: '4Sum',                difficulty: 'Hard',   category: 'Two Pointers',     solved: false, url: '' },
      { id: 'longest-consecutive', name: 'Longest Consecutive', difficulty: 'Medium', category: 'Arrays & Hashing', solved: false, url: '' },
    ],
  },
  companies: ['Google', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Stripe', 'Microsoft', 'Bloomberg'],
  problemId: 'lc_1_two_sum',
};

// ─────────────────────────────────────────────────────────────

const MAIN_BUCKETS = [
  'STEP_0_INITIAL',
  'STEP_1_APPROACH',
  'STEP_2_VARIANT',
  'STEP_3_MECHANICS',
  'STEP_4_EDGE_CASES',
];

function areAllMainCheckpointsComplete(checkpoints) {
  return MAIN_BUCKETS.every((bk) => checkpoints[bk]?.status === 'completed');
}

const AMentorPage: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isPreview = searchParams.get('preview') === '1' || !problemId;

  const reduxSession = useSelector(selectAMentorSession);

  const session = isPreview
    ? {
        status: 'succeeded',
        error: null,
        title: 'Two Sum',
        difficulty: 'Easy',
        initial: MOCK_INITIAL,
        step0Complete: false,
        roadmap: MOCK_ROADMAP,
        checkpoints: MOCK_CHECKPOINTS,
        activeCheckpointBucket: null,
        gradingActivity: null,
        fetchingHint: false,
        evaluating: false,
        evaluations: [],
      }
    : reduxSession;

  const {
    status,
    error,
    title,
    difficulty,
    initial,
    step0Complete,
    roadmap,
    checkpoints,
    activeCheckpointBucket,
    gradingActivity,
    fetchingHint,
    evaluating,
    evaluations,
  } = session;

  const [showEvaluation, setShowEvaluation] = useState(false);
  const userSubTaskId = searchParams.get('userSubTaskId') || undefined;

  useEffect(() => {
    if (!isPreview && problemId) {
      dispatch(resetSession());
      dispatch(bootstrapAMentorSession({ problemId, userSubTaskId }));
    }
  }, [problemId, userSubTaskId, dispatch, isPreview]);

  const handleBack = useCallback(async () => {
    if (isPreview) { navigate(-1); return; }
    try {
      await dispatch(recordSessionEvent({ eventType: 'SESSION_TERMINATED', payload: {} })).unwrap();
    } catch (err) {
      console.warn('[AMentorPage] Failed to record SESSION_TERMINATED event:', err);
    }
    navigate(-1);
  }, [dispatch, navigate, isPreview]);

  const handleStep0Complete = useCallback(() => {
    if (!isPreview) dispatch(completeStep0());
  }, [dispatch, isPreview]);

  const handleCheckpointClick = useCallback(
    (bucket) => {
      if (isPreview) return;
      const cp = checkpoints[bucket];
      if (!cp || cp.status === 'locked') return;
      if (bucket === 'STEP_0_INITIAL') {
        dispatch(setActiveCheckpoint(null));
        dispatch(resetStep0());
        return;
      }
      dispatch(setActiveCheckpoint(bucket));
      dispatch(loadBucket({ bucket }));
    },
    [dispatch, checkpoints, isPreview]
  );

  const handleCheckpointBack = useCallback(() => dispatch(setActiveCheckpoint(null)), [dispatch]);

  const handleSubmitAnswer = useCallback(
    (activityId, answer) => {
      if (!activeCheckpointBucket) return;
      dispatch(submitAnswer({ bucket: activeCheckpointBucket, activityId, answer }));
    },
    [dispatch, activeCheckpointBucket]
  );

  const handleRequestHint = useCallback(
    (activityId, level) => {
      if (!activeCheckpointBucket) return;
      dispatch(fetchHint({ bucket: activeCheckpointBucket, activityId, revealLevel: level }));
    },
    [dispatch, activeCheckpointBucket]
  );

  const handleEvaluate = useCallback(
    (payload) => {
      dispatch(evaluateCode({
        problem_id: problemId,
        user_code: payload.userCode,
        language: payload.language,
        judge_result: payload.judgeResult,
        userSubTaskId,
      }));
    },
    [dispatch, problemId, userSubTaskId]
  );

  const handleGoToCheckpoint = useCallback(
    (bucket) => {
      setShowEvaluation(false);
      handleCheckpointClick(bucket);
    },
    [handleCheckpointClick]
  );

  const handleProceed = useCallback(() => {
    if (activeCheckpointBucket) dispatch(advanceActivityAndRecord(activeCheckpointBucket));
  }, [dispatch, activeCheckpointBucket]);

  const handleRetry = useCallback(() => {
    if (problemId) {
      dispatch(resetSession());
      dispatch(bootstrapAMentorSession({ problemId, userSubTaskId }));
    }
  }, [problemId, userSubTaskId, dispatch]);

  const handleFinish = useCallback(async () => {
    if (isPreview) { navigate(-1); return; }
    try {
      await dispatch(recordSessionEvent({ eventType: 'SESSION_COMPLETED', payload: {} })).unwrap();
    } catch (err) {
      console.error('Failed to record SESSION_COMPLETED event:', err);
    }
    navigate(-1);
  }, [dispatch, navigate, isPreview]);

  if (!isPreview && (status === 'loading' || status === 'idle')) {
    return (
      <div className="amentor-page amentor-page--loading" data-testid="amentor-loading">
        <div className="amentor-page__spinner" />
        <p className="amentor-page__loading-text">Preparing your mission…</p>
      </div>
    );
  }

  if (!isPreview && status === 'failed') {
    return (
      <div className="amentor-page amentor-page--error" data-testid="amentor-error">
        <p className="amentor-page__error-text">{error || 'Something went wrong'}</p>
        <button className="amentor-page__retry-btn" data-testid="amentor-retry" onClick={handleRetry}>
          Retry
        </button>
      </div>
    );
  }

  const victory = step0Complete && areAllMainCheckpointsComplete(checkpoints);
  const activeCheckpoint = activeCheckpointBucket ? checkpoints[activeCheckpointBucket] : null;
  const lastRouting = evaluations.length > 0 ? evaluations[evaluations.length - 1].routing : null;

  return (
    <div className="amentor-page" data-testid="amentor-page">
      {step0Complete && (
        <AMentorTopBar
          title={title}
          difficulty={difficulty}
          onBack={handleBack}
        />
      )}

      <div className="amentor-page__content-wrapper">
        <div className={step0Complete ? "amentor-page__content" : "amentor-page__content--briefing"}>
          {victory ? (
            <AMentorVictory title={title} onFinish={handleFinish} />
          ) : activeCheckpoint ? (
            <AMentorCheckpointDetail
              checkpoint={activeCheckpoint}
              onBack={handleCheckpointBack}
              onSubmit={handleSubmitAnswer}
              onProceed={handleProceed}
              onRequestHint={handleRequestHint}
              gradingActivity={gradingActivity}
              fetchingHint={fetchingHint}
            />
          ) : showEvaluation ? (
            <div data-testid="evaluation-screen">
              <button
                className="amentor-page__eval-back-btn"
                data-testid="eval-back-btn"
                onClick={() => setShowEvaluation(false)}
              >
                ← Back to Roadmap
              </button>
              <AMentorEvaluation
                onEvaluate={handleEvaluate}
                evaluating={evaluating}
                lastRouting={lastRouting}
                onGoToCheckpoint={handleGoToCheckpoint}
              />
            </div>
          ) : step0Complete ? (
            <div className="amentor-page__roadmap-container">
              <AMentorRoadmap
                roadmap={roadmap}
                checkpoints={checkpoints}
                onCheckpointClick={handleCheckpointClick}
              />
            </div>
          ) : (
            <div data-testid="step0-screen" style={{ height: '100%', width: '100%' }}>
              <AMentorStep0Screen
                initial={initial || MOCK_INITIAL}
                title={title}
                onComplete={handleStep0Complete}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AMentorPage;
