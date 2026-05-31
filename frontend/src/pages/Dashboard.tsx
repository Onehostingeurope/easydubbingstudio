import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

interface Project {
  id: string;
  title: string;
  source_type: string;
  source_video_url?: string;
  source_language: string;
  mode: string;
  status: 'draft' | 'pending' | 'running' | 'completed' | 'failed' | 'partial';
  credits_used: number;
  created_at: string;
  translations?: any[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    creditsUsed: 0,
    activeJobs: 0
  });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user projects
        const response = await fetch('/_/backend/api/projects', {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });
        const result = await response.json();
        
        if (response.ok && result.projects) {
          setProjects(result.projects);
          
          // Calculate statistics
          const total = result.projects.length;
          const credits = result.projects.reduce((acc: number, p: Project) => acc + p.credits_used, 0);
          const active = result.projects.filter(
            (p: Project) => p.status === 'pending' || p.status === 'running'
          ).length;

          setStats({
            totalProjects: total,
            creditsUsed: credits,
            activeJobs: active
          });
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();

    // Set up auto-refresh interval every 15 seconds to fetch latest background status updates
    const interval = setInterval(loadDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeQueue = projects.filter(p => p.status === 'pending' || p.status === 'running');

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Console</h2>
          <p className="text-on-surface-variant text-sm mt-1">Your video translation engine status.</p>
        </div>
        <button
          onClick={() => navigate('/projects/new')}
          className="primary-btn px-6 py-2.5 rounded-lg font-bold text-white shadow-lg cyan-glow active:scale-95 duration-100 flex items-center gap-2 text-xs font-technical"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          <span>NEW PROJECT</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="font-technical text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Total Projects</p>
            <p className="text-2xl font-bold">{stats.totalProjects}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-xl">folder_open</span>
          </div>
        </div>
        <div className="glass-card p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="font-technical text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Credits Used</p>
            <p className="text-2xl font-bold">{stats.creditsUsed}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-xl">bar_chart</span>
          </div>
        </div>
        <div className="glass-card p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="font-technical text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Active Jobs</p>
            <p className="text-2xl font-bold">{stats.activeJobs}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-xl">bolt</span>
          </div>
        </div>
      </div>

      {/* Main Console Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Projects */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight">Recent Projects</h3>
            {projects.length > 0 && (
              <span className="text-xs text-on-surface-variant font-technical">
                {projects.length} Total
              </span>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center opacity-70 hover:opacity-100 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
              </div>
              <h4 className="text-lg font-bold mb-2">Ready to scale your content?</h4>
              <p className="text-on-surface-variant text-sm max-w-sm mb-6 leading-relaxed">
                Start a new project to translate your videos into over 40 languages with cinematic AI voice cloning.
              </p>
              <button 
                onClick={() => navigate('/projects/new')}
                className="px-6 py-2.5 border border-primary/40 rounded-lg text-primary font-bold text-xs font-technical hover:bg-primary/10 transition-all"
              >
                CREATE YOUR FIRST PROJECT
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => {
                const targetLangs = project.translations?.map(t => t.language).join(', ') || '';
                
                // Set background placeholder image matching title
                const imgUrl = 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600&auto=format&fit=crop';
                
                return (
                  <Link 
                    key={project.id} 
                    to={`/projects/${project.id}`}
                    className="glass-card rounded-xl overflow-hidden group block hover:no-underline"
                  >
                    <div className="relative h-40 bg-surface-container-low">
                      <img 
                        src={imgUrl} 
                        alt={project.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                      />
                      <div className="absolute top-2 right-2 px-3 py-1 bg-[#020408]/80 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          project.status === 'completed' ? 'bg-emerald-400' :
                          project.status === 'failed' ? 'bg-red-500' :
                          project.status === 'partial' ? 'bg-amber-400' : 'bg-primary animate-pulse'
                        }`}></span>
                        <span className="font-technical text-[9px] uppercase font-bold text-[#e2e2e8]">
                          {project.status}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020408]/90 to-transparent"></div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-base truncate group-hover:text-primary transition-colors">{project.title}</h4>
                      <p className="font-technical text-[10px] text-on-surface-variant mt-1">
                        Source: {project.source_language} → {targetLangs || 'Translating'}
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                        <span className="font-technical text-[10px] text-outline">
                          {new Date(project.created_at).toLocaleDateString()}
                        </span>
                        <span className="font-technical text-[10px] text-tertiary">
                          {project.credits_used} Credits Used
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Processing Queue / Tip boxes */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-lg">hourglass_bottom</span>
            <h3 className="text-xl font-bold tracking-tight">Active Engine Jobs</h3>
          </div>

          <div className="space-y-4">
            {activeQueue.length === 0 ? (
              <div className="glass-panel p-6 rounded-xl border border-white/5 text-center text-on-surface-variant text-sm py-12">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 block mb-2">check_circle</span>
                <p>No active processing jobs. Everything is completed.</p>
              </div>
            ) : (
              activeQueue.map((job) => {
                const percentage = job.status === 'pending' ? 10 : 65;
                return (
                  <div key={job.id} className="glass-card p-5 rounded-xl border border-white/5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h5 className="font-bold text-sm truncate max-w-[150px]">{job.title}</h5>
                        <p className="font-technical text-[9px] text-on-surface-variant mt-0.5">
                          {job.mode === 'precision' ? 'Precision Cinematic Mode' : 'Real-time Speed Mode'}
                        </p>
                      </div>
                      <span className="font-technical text-[9px] text-tertiary bg-tertiary/10 px-2 py-0.5 rounded border border-tertiary/20 animate-pulse uppercase font-bold">
                        {job.status}
                      </span>
                    </div>

                    <div className="mb-2 flex justify-between font-technical text-[10px]">
                      <span className="text-on-surface-variant">Sync Progress</span>
                      <span className="text-tertiary font-bold">{percentage}%</span>
                    </div>

                    <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pro Tip Card */}
          <div className="bg-gradient-to-br from-secondary-container/20 to-primary-container/20 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">lightbulb</span>
              <span>Pro Tip</span>
            </h4>
            <p className="text-xs text-on-surface-variant leading-relaxed font-technical">
              Try translating using <strong>Precision Mode</strong>. It re-animates speakers' lips utilizing a generative rendering pipeline to blend dubbed speech smoothly.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
