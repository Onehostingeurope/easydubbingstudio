import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import NewProject from './pages/NewProject';
import ProjectDetails from './pages/ProjectDetails';
import Billing from './pages/Billing';
import Login from './pages/Login';
import Register from './pages/Register';

// Protected Route Guard
function PrivateRoute({ children }: { children: JSX.Element }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return session ? children : <Navigate to="/login" replace />;
}

// Private Layout with Shared Sidebar / Navbar
function StudioLayout({ children }: { children: JSX.Element }) {
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
    }
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'New Project', path: '/projects/new', icon: 'add_circle' },
    { name: 'Billing', path: '/billing', icon: 'payments' }
  ];

  return (
    <div className="bg-[#020408] text-[#e2e2e8] min-h-screen flex font-body">
      {/* Sidebar Component */}
      <aside className="hidden md:flex flex-col h-screen w-64 bg-surface-container border-r border-white/5 py-8 sticky top-0 shrink-0">
        <div className="px-6 mb-10">
          <Link to="/dashboard">
            <h1 className="font-semibold text-xl text-primary tracking-tight">Easy Dubbing</h1>
          </Link>
          <p className="font-technical text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
            Studio • {profile?.plan || 'Starter'} Tier
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-technical text-xs transition-all ${
                  isActive
                    ? 'text-tertiary bg-tertiary-container/10 border-r-2 border-tertiary translate-x-1'
                    : 'text-on-surface-variant hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-technical text-xs text-error/80 hover:bg-error-container/10 transition-all text-left"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span>Sign Out</span>
          </button>
        </nav>

        <div className="px-4 mt-auto">
          <button
            onClick={() => navigate('/projects/new')}
            className="w-full primary-btn text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 duration-100"
          >
            <span className="material-symbols-outlined text-lg">movie_edit</span>
            <span className="text-sm font-semibold">New Dub</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Shared Top Navbar */}
        <header className="h-20 flex justify-between items-center px-6 md:px-10 border-b border-white/5 bg-background sticky top-0 z-40">
          <div className="md:hidden">
            <Link to="/dashboard">
              <h1 className="font-semibold text-lg text-primary tracking-tight">Easy Dubbing</h1>
            </Link>
          </div>
          <div className="hidden md:block">
            <span className="text-xs text-on-surface-variant">Cinematic Dubbing Studio</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-surface-container-high rounded-full border border-white/5">
              <span className="material-symbols-outlined text-tertiary text-sm">database</span>
              <span className="font-technical text-xs text-on-surface">
                {profile?.credits_balance ?? 0} <span className="text-on-surface-variant">Credits</span>
              </span>
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-xs font-bold font-technical">
                {profile?.full_name?.substring(0, 2).toUpperCase() || 'ED'}
              </div>
            </div>
          </div>
        </header>

        {/* Studio Content Area */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-surface-container-low border-t border-white/5 flex justify-around items-center py-3 z-50">
        <Link to="/dashboard" className="text-on-surface-variant hover:text-primary flex flex-col items-center">
          <span className="material-symbols-outlined text-xl">dashboard</span>
          <span className="text-[10px] mt-0.5">Home</span>
        </Link>
        <Link to="/projects/new" className="w-12 h-12 primary-btn rounded-full flex items-center justify-center -mt-6 border-4 border-[#020408] text-white shadow-xl">
          <span className="material-symbols-outlined">add</span>
        </Link>
        <Link to="/billing" className="text-on-surface-variant hover:text-primary flex flex-col items-center">
          <span className="material-symbols-outlined text-xl">payments</span>
          <span className="text-[10px] mt-0.5">Billing</span>
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Marketing routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private Studio routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <StudioLayout>
                <Dashboard />
              </StudioLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <PrivateRoute>
              <StudioLayout>
                <NewProject />
              </StudioLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <PrivateRoute>
              <StudioLayout>
                <ProjectDetails />
              </StudioLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <PrivateRoute>
              <StudioLayout>
                <Billing />
              </StudioLayout>
            </PrivateRoute>
          }
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
