import { Toaster, SonnerToaster as Sonner } from '@shared/ui';
import { TooltipProvider } from '@shared/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/hooks/useAuth';
import { CarModelsProvider } from '@/contexts/CarModelsContext';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';

// All pages lazy loaded for code splitting — each becomes its own chunk
const Rezerwacje = lazy(() => import('./pages/Rezerwacje'));
const MojaRezerwacja = lazy(() => import('./pages/MojaRezerwacja'));
const InstanceAuth = lazy(() => import('./pages/InstanceAuth'));
const SuperAdminAuth = lazy(() => import('./pages/SuperAdminAuth'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SalesDashboard = lazy(() => import('./pages/SalesDashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const HallView = lazy(() => import('./pages/HallView'));
const PublicOfferView = lazy(() => import('./pages/PublicOfferView'));
const PublicProtocolView = lazy(() => import('./pages/PublicProtocolView'));
const EmbedLeadForm = lazy(() => import('./pages/EmbedLeadForm'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));
const DesignSystem = lazy(() => import('./pages/DesignSystem'));
const ReminderTemplateEditPage = lazy(() => import('./pages/ReminderTemplateEditPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minut
      retry: 1,
    },
  },
});

// Helper function to detect subdomain from hostname
// New structure:
// - armcar.carfect.pl → public calendar
// - armcar.admin.carfect.pl → admin panel
// - super.admin.carfect.pl → super admin panel
const getSubdomainInfo = () => {
  const hostname = window.location.hostname;

  console.log('[Subdomain Detection] hostname:', hostname);

  // Local development - no subdomain detection
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('[Subdomain Detection] → dev mode');
    return { type: 'dev', subdomain: null };
  }

  // Check for carfect.pl domain
  if (hostname.endsWith('.carfect.pl')) {
    const subdomain = hostname.replace('.carfect.pl', '');
    console.log('[Subdomain Detection] subdomain extracted:', subdomain);

    // Super admin subdomain: super.admin.carfect.pl
    if (subdomain === 'super.admin') {
      console.log('[Subdomain Detection] → super_admin mode');
      return { type: 'super_admin', subdomain: 'super.admin' };
    }

    // Instance admin subdomain: armcar.admin.carfect.pl
    if (subdomain.endsWith('.admin')) {
      const instanceSlug = subdomain.replace('.admin', '');
      console.log('[Subdomain Detection] → instance_admin mode:', instanceSlug);
      return { type: 'instance_admin', subdomain: instanceSlug };
    }

    // Instance public subdomain: armcar.carfect.pl
    console.log('[Subdomain Detection] → instance_public mode:', subdomain);
    return { type: 'instance_public', subdomain };
  }

  // Default - unknown domain
  console.log('[Subdomain Detection] → unknown domain');
  return { type: 'unknown', subdomain: null };
};

// Super Admin Routes Component
const SuperAdminRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/login" element={<SuperAdminAuth />} />
      <Route
        path="/"
        element={
          <ProtectedRoute requiredRole="super_admin">
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

// Instance Public Routes - for armcar.carfect.pl (public calendar only)
const InstancePublicRoutes = ({ subdomain }: { subdomain: string }) => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Rezerwacje instanceSubdomain={subdomain} />} />
      <Route path="/res" element={<MojaRezerwacja />} />
      <Route path="/moja-rezerwacja" element={<Navigate to="/res" replace />} />
      <Route path="/offers/:token" element={<PublicOfferView />} />
      <Route path="/protocols/:token" element={<PublicProtocolView />} />
      <Route path="/embed" element={<EmbedLeadForm />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

// Instance Admin Routes - for armcar.admin.carfect.pl (admin panel)
const InstanceAdminRoutes = ({ subdomain }: { subdomain: string }) => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Login page - must be first */}
      <Route path="/login" element={<InstanceAuth subdomainSlug={subdomain} />} />
      <Route path="/forgot-password" element={<ForgotPassword subdomainSlug={subdomain} />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public routes - BEFORE catch-all */}
      <Route path="/offers/:token" element={<PublicOfferView />} />
      <Route path="/protocols/:token" element={<PublicProtocolView />} />

      {/* Role-based redirect - ONLY for /dashboard */}
      <Route path="/dashboard" element={<RoleBasedRedirect />} />

      {/* Hall view - specific route BEFORE catch-all */}
      <Route
        path="/halls/:hallId"
        element={
          <ProtectedRoute requiredRole="admin">
            <HallView />
          </ProtectedRoute>
        }
      />

      {/* Reminder template routes - must be before /:view? to avoid conflict */}
      <Route
        path="/reminders/:shortId"
        element={
          <ProtectedRoute requiredRole="admin">
            <ReminderTemplateEditPage />
          </ProtectedRoute>
        }
      />

      {/* Sales CRM routes - BEFORE catch-all /:view? */}
      <Route
        path="/sales-crm/:view?"
        element={
          <ProtectedRoute requiredRole="admin">
            <SalesDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin dashboard with optional view param - handles both / and /:view */}
      <Route
        path="/:view?"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

// Loading fallback for lazy loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Development Routes - full access for local testing
const DevRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Navigate to="/rezerwacje" replace />} />
      <Route path="/rezerwacje" element={<Rezerwacje />} />
      <Route path="/res" element={<MojaRezerwacja />} />
      <Route path="/moja-rezerwacja" element={<Navigate to="/res" replace />} />
      <Route path="/offers/:token" element={<PublicOfferView />} />
      <Route path="/protocols/:token" element={<PublicProtocolView />} />
      {/* Instance-specific login route */}
      <Route path="/:slug/login" element={<InstanceAuth />} />
      <Route path="/:slug/forgot-password" element={<ForgotPassword />} />
      <Route path="/:slug/reset-password" element={<ResetPassword />} />
      {/* Default login without slug - use demo instance for dev */}
      <Route path="/login" element={<InstanceAuth subdomainSlug="demo" />} />
      <Route path="/forgot-password" element={<ForgotPassword subdomainSlug="demo" />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* Role-based redirect after login */}
      <Route path="/dashboard" element={<RoleBasedRedirect />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/halls/:hallId"
        element={
          <ProtectedRoute requiredRole="admin">
            <HallView />
          </ProtectedRoute>
        }
      />
      {/* Halls without /admin prefix - for hall role navigation */}
      <Route
        path="/halls/:hallId"
        element={
          <ProtectedRoute requiredRole="admin">
            <HallView />
          </ProtectedRoute>
        }
      />
      {/* Reminder template routes - must be before /admin/:view to avoid conflict */}
      <Route
        path="/admin/reminders/:shortId"
        element={
          <ProtectedRoute requiredRole="admin">
            <ReminderTemplateEditPage />
          </ProtectedRoute>
        }
      />
      {/* Sales CRM routes - BEFORE /admin/:view */}
      <Route
        path="/admin/sales-crm/:view?"
        element={
          <ProtectedRoute requiredRole="admin">
            <SalesDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/:view"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute requiredRole="super_admin">
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      {/* Design system - component showcase */}
      <Route path="/design-system" element={<DesignSystem />} />
      {/* Legacy routes - redirect to login */}
      <Route path="/admin/login" element={<InstanceAuth />} />
      <Route path="/super-admin/login" element={<SuperAdminAuth />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

const App = () => {
  const subdomainInfo = getSubdomainInfo();

  const renderRoutes = () => {
    switch (subdomainInfo.type) {
      case 'super_admin':
        return <SuperAdminRoutes />;
      case 'instance_admin':
        return <InstanceAdminRoutes subdomain={subdomainInfo.subdomain!} />;
      case 'instance_public':
        return <InstancePublicRoutes subdomain={subdomainInfo.subdomain!} />;
      case 'dev':
      default:
        return <DevRoutes />;
    }
  };

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CarModelsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>{renderRoutes()}</BrowserRouter>
            </TooltipProvider>
          </CarModelsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
