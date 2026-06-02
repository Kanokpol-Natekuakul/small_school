import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authService, settingsService } from './lib/db';
import type { Profile } from './types';
import { Login } from './features/auth/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './features/dashboard/Dashboard';
import { IncomingDocs } from './features/documents/IncomingDocs';
import { OutgoingDocs } from './features/documents/OutgoingDocs';
import { CircularDocs } from './features/documents/CircularDocs';
import { StaffDirectory } from './features/school/StaffDirectory';
import { StudentDirectory } from './features/school/StudentDirectory';
import { SettingsPage } from './features/settings/Settings';
import { isSupabaseBackend } from './lib/supabase';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [academicYear, setAcademicYear] = useState('2569');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const user = await authService.restoreCurrentUser();
        if (!isMounted) {
          return;
        }

        if (user) {
          setCurrentUser(user);
        }
        
        if (!isSupabaseBackend || user) {
          // Load academic year from settings when local data is available or the Supabase session is ready.
          const settings = await settingsService.getSettings();
          if (!isMounted) {
            return;
          }

          if (settings && settings.academic_year) {
            setAcademicYear(settings.academic_year);
          }
        }
      } catch (err) {
        console.error('Failed to initialize app settings', err);
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSuccess = () => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setCurrentTab('dashboard');
    
    // Refresh academic year
    settingsService.getSettings().then(settings => {
      if (settings && settings.academic_year) {
        setAcademicYear(settings.academic_year);
      }
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleSettingsUpdated = (newYear: string) => {
    setAcademicYear(newYear);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Active tab renderer
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} setCurrentTab={setCurrentTab} />;
      case 'incoming':
        return <IncomingDocs currentUser={currentUser} />;
      case 'outgoing':
        return <OutgoingDocs currentUser={currentUser} />;
      case 'circular':
        return <CircularDocs currentUser={currentUser} />;
      case 'staff':
        return <StaffDirectory currentUser={currentUser} />;
      case 'students':
        return <StudentDirectory currentUser={currentUser} />;
      case 'settings':
        return <SettingsPage currentUser={currentUser} onSettingsUpdated={handleSettingsUpdated} />;
      default:
        return <Dashboard currentUser={currentUser} setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <Layout
      currentUser={currentUser}
      onLogout={handleLogout}
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      academicYear={academicYear}
    >
      {renderTabContent()}
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
