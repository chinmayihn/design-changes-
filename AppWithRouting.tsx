// @ts-nocheck
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ProtectedLayout from './components/organisms/ProtectedLayout';
import GlobalLoader from './components/organisms/GlobalLoader';
import ToastContainer from './components/organisms/ToastContainer';
import { AuthProvider } from './context/AuthContext';
import { useAuthContext } from './hooks/useAuthContext';
import { PageOnboardingProvider } from './context/PageOnboardingContext';
import { SubscriptionWallOverlay } from './components/organisms/Subscription/SubscriptionWallOverlay';

// ... (other imports)
import { ToastProvider } from './context/ToastContext';

// --- NEW IMPORT FOR LEGAL PAGES ---
import { PrivacyPolicy, TermsOfService } from './pages/LegalPages';

// Lazy load page components
const CodingPage = React.lazy(() => import('./pages/CodingPage'));
const SystemDesignPage = React.lazy(() => import('./pages/SystemDesignPage'));
const SystemDesignDailyWorkspace = React.lazy(() => import('./pages/SystemDesignDailyWorkspace'));
const NewSystemDesignCanvasPage = React.lazy(() => import('./pages/NewSystemDesignCanvasPage'));
const TrackDetailPage = React.lazy(() => import('./pages/TrackDetailPage'));
const CodeAttemptPageContainer = React.lazy(() => import('./pages/CodeAttemptPageContainer'));
const ComponentShowcase = React.lazy(() => import('./pages/ComponentShowcase'));
const EmailLandingPage = React.lazy(() => import('./pages/EmailLandingPage'));
const GmailComposerPage = React.lazy(() => import('./pages/GmailComposerPage'));
const AIEmailPipelinePage = React.lazy(() => import('./pages/AIEmailPipelinePage'));
const ReportPage = React.lazy(() => import('./pages/ReportPage'));
const ReportDashboardPage = React.lazy(() => import('./pages/ReportDashboardPage'));
const KnowledgeBaseInteractivePage = React.lazy(() => import('./pages/KnowledgeBaseInteractivePage'));
const SystemDesignReviewPage = React.lazy(() => import('./pages/SystemDesignReviewPage'));
const CodingReviewPage = React.lazy(() => import('./pages/CodingReviewPage'));
const WebhookSetupGuidePage = React.lazy(() => import('./pages/WebhookSetupGuidePage'));
const AuthPage = React.lazy(() => import('./pages/AuthPage'));
const GoogleOAuthCallbackPage = React.lazy(() => import('./pages/GoogleOAuthCallbackPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const EmailVerificationPage = React.lazy(() => import('./pages/EmailVerificationPage'));
import OnboardingPage from './pages/OnboardingPage';
const NewPublicLandingPage = React.lazy(() => import('./pages/NewPublicLandingPage'));
const ComingSoonLandingPage = React.lazy(() => import('./pages/ComingSoonLandingPage'));
const DailyLaunchpadV2Page = React.lazy(() => import('./pages/DailyLaunchpadV2Page'));
const SurveyPage = React.lazy(() => import('./pages/SurveyPage'));
const AMentorPage = React.lazy(() => import('./pages/AMentorPage'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const OrionAIMentorPage = React.lazy(() => import('./pages/OrionAIMentorPage'));
const AuroraSystemDesignPage = React.lazy(() => import('./pages/AuroraSystemDesignPage'));

// --- BLOG PAGES (Lazy Loaded) ---
const BlogHome = React.lazy(() => import('./pages/blog/BlogHome'));
const BlogPostLayout = React.lazy(() => import('./pages/blog/BlogPostLayout'));

// --- SCROLL FIX COMPONENT ---
// This ensures the page always starts at the top when you navigate
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Root page component that conditionally renders based on auth status
const RootPage = () => {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading-spinner" style={{
          border: '4px solid rgba(0, 102, 255, 0.1)',
          borderRadius: '50%',
          borderTop: '4px solid #0066ff',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Check if we're in pre-launch phase (before November 10th, 2025 at 1:30 PM UTC)
  const isPreLaunch = new Date() < new Date('2025-11-10T13:30:00Z');
  
  // If authenticated, redirect to daily launchpad
  if (isAuthenticated) {
    return <Navigate to="/daily-launchpad" replace />;
  }
  
  // If not authenticated, show appropriate landing page based on launch date
  return isPreLaunch ? <ComingSoonLandingPage /> : <NewPublicLandingPage />;
};

// Internal App component that uses the AuthProvider
const AppRoutes = () => {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <Routes>
        {/* Public routes accessible without authentication */}
        <Route path="/" element={<RootPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/google/callback" element={<GoogleOAuthCallbackPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/verify-email" element={<EmailVerificationPage />} />
        
        {/* --- LEGAL ROUTES --- */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        {/* --- PRICING (public, non-protected) --- */}
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/mentor/:problemId" element={<AMentorPage />} />

        {/* --- PRODUCT PAGES (public, SEO/AEO optimized) --- */}
        <Route path="/orion-ai-mentor" element={<OrionAIMentorPage />} />
        <Route path="/aurora-system-design" element={<AuroraSystemDesignPage />} />

        {/* --- BLOG ROUTES (PUBLIC) --- */}
        <Route path="/blog" element={<BlogHome />} />
        <Route path="/blog/:slug" element={<BlogPostLayout />} />
        
        
        {/* Protected routes with ProtectedLayout */}
        <Route path="/*" element={
          <ProtectedLayout>
            <Routes>
              <Route path="/daily-launchpad" element={<DailyLaunchpadV2Page />} />
              <Route path="/coding" element={<CodingPage />} />
              <Route path="/system-design" element={<SystemDesignPage />} />
              <Route path="/system-design/requirements/:trackId" element={<SystemDesignDailyWorkspace />} />
              <Route path="/mentor/:problemId" element={<AMentorPage />} />
              <Route path="/system-design/canvas" element={<NewSystemDesignCanvasPage />} />
              <Route path="/showcase" element={<ComponentShowcase />} />
              <Route path="/track/:trackId" element={<TrackDetailPage />} />
              <Route path="/problem/:problemId" element={<CodeAttemptPageContainer />} />
              <Route path="/email" element={<EmailLandingPage />} />
              <Route path="/email/gmail-composer" element={<GmailComposerPage />} />
              <Route path="/email/ai-pipeline/:step" element={<AIEmailPipelinePage />} />
              <Route path="/email/ai-pipeline" element={<AIEmailPipelinePage />} />
              <Route path="/report" element={<ReportDashboardPage />} />
              <Route path="/report/:id" element={<ReportPage />} />
              <Route path="/review/system-design" element={<SystemDesignReviewPage />} />
              <Route path="/review/coding" element={<CodingReviewPage />} />
              <Route path="/knowledge-base/interactive/:trackId" element={<KnowledgeBaseInteractivePage />} />
              <Route path="/knowledge-base/email/webhook-setup-guide" element={<WebhookSetupGuidePage />} />
              <Route path="/survey" element={<SurveyPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ProtectedLayout>
        } />
      </Routes>
    </Suspense>
  );
};

// Main app component that wraps everything with Router and AuthProvider
export default function AppWithRouting() {
  return (
    <Router>
      {/* ADDED SCROLL FIX HERE */}
      <ScrollToTop />
      
      <AuthProvider>
        <ToastProvider>
          <PageOnboardingProvider>
            <AppRoutes />
            <ToastContainer />
            <SubscriptionWallOverlay />
          </PageOnboardingProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}
