import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

interface Translation {
  id: string;
  language: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  caption_srt_url?: string;
  caption_vtt_url?: string;
  duration?: number;
  failure_code?: string;
  failure_message?: string;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  source_type: string;
  source_video_url?: string;
  source_language: string;
  mode: string;
  status: string;
  credits_used: number;
  enable_caption: boolean;
  translate_audio_only: boolean;
  enable_speech_enhancement: boolean;
  disable_music_track: boolean;
  created_at: string;
  translations?: Translation[];
}

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  const fetchProjectDetails = async () => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const response = await fetch(`/_/backend/api/projects/${id}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.project) {
        setProject(data.project);
        
        // Find completed video translations to pre-fill preview URL
        const completedTrans = data.project.translations?.find((t: Translation) => t.status === 'completed');
        if (completedTrans?.video_url) {
          setActiveVideoUrl(completedTrans.video_url);
        } else if (data.project.source_video_url) {
          setActiveVideoUrl(data.project.source_video_url);
        }
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
    
    // Auto refresh active/running tasks every 10 seconds
    const interval = setInterval(() => {
      if (project && (project.status === 'pending' || project.status === 'running')) {
        handleRefresh();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const response = await fetch(`/_/backend/api/projects/${id}/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.project) {
        setProject(data.project);
        // Update active video if completed
        const completedTrans = data.project.translations?.find((t: Translation) => t.status === 'completed');
        if (completedTrans?.video_url && !activeVideoUrl) {
          setActiveVideoUrl(completedTrans.video_url);
        }
      }
    } catch (err) {
      console.error('Refresh status check failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetry = async () => {
    setRefreshing(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const response = await fetch(`/_/backend/api/projects/${id}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (response.ok) {
        fetchProjectDetails();
      } else {
        const result = await response.json();
        alert(`Retry failed: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Retry submission failed: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete this project? This will permanently remove all video translation jobs.')) {
      return;
    }
    setDeleting(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const response = await fetch(`/_/backend/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (response.ok) {
        navigate('/dashboard');
      } else {
        const result = await response.json();
        alert(`Deletion failed: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadCaption = async (translationId: string, format: 'srt' | 'vtt') => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const response = await fetch(`/_/backend/api/projects/${project?.id}/caption/${translationId}?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Caption files download failed.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subtitle_${translationId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Caption download failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-10 text-center font-technical">
        <h3 className="text-xl font-bold text-error">Project not found</h3>
        <Link to="/dashboard" className="text-primary hover:underline mt-4 inline-block">Return to Console</Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 font-body relative pb-24">
      {/* Project Header details */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className={`text-[10px] font-technical uppercase font-bold px-2 py-0.5 rounded tracking-widest ${
              project.status === 'completed' ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30' :
              project.status === 'failed' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
              project.status === 'partial' ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-primary/20 text-primary border border-primary/30 animate-pulse'
            }`}>
              {project.status}
            </span>
            <span className="text-on-surface-variant text-xs font-technical uppercase">ID: {project.id.substring(0, 8)}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface">Project: {project.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDeleteProject}
            disabled={deleting}
            className="px-4 py-2.5 rounded-lg border border-red-500/30 hover:border-red-500 text-red-400 hover:bg-red-500/5 text-xs font-technical transition-all flex items-center gap-2 active:scale-95 duration-100"
          >
            <span className="material-symbols-outlined text-base">delete</span>
            <span>{deleting ? 'DELETING...' : 'DELETE PROJECT'}</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-lg border border-white/10 text-xs font-technical hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <span className={`material-symbols-outlined text-base ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
            <span>{refreshing ? 'REFRESHING' : 'REFRESH STATUS'}</span>
          </button>
          
          {project.status === 'failed' && (
            <button
              onClick={handleRetry}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-lg primary-gradient text-[#002e6a] font-bold text-xs font-technical active:scale-95 duration-100 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">cached</span>
              <span>RETRY FAILED JOBS</span>
            </button>
          )}
        </div>
      </header>

      {/* Main split grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Video player preview & Status chips */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative group rounded-2xl overflow-hidden glass-panel border border-white/5">
            {activeVideoUrl ? (() => {
              // Parse YouTube link
              const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
              const match = activeVideoUrl.match(regExp);
              const isYouTube = match && match[2].length === 11;
              const embedUrl = isYouTube ? `https://www.youtube.com/embed/${match[2]}` : null;

              if (embedUrl) {
                return (
                  <iframe
                    src={embedUrl}
                    className="w-full aspect-video bg-black object-contain border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                );
              }

              return (
                <video
                  ref={videoPlayerRef}
                  src={activeVideoUrl}
                  controls
                  className="w-full aspect-video bg-black object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
                />
              );
            })() : (
              <div className="aspect-video bg-surface-container-low flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 animate-pulse">video_library</span>
                <p className="text-sm font-medium">Video rendering is in progress.</p>
                <p className="text-[10px] uppercase font-technical mt-1">Status: pending queues</p>
              </div>
            )}
          </div>

          {/* Configuration Parameters chips */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface-container border border-white/5 text-center">
              <span className="block font-technical text-[9px] text-on-surface-variant uppercase mb-1">Visual Mode</span>
              <span className="block text-primary font-bold text-xs uppercase font-technical">
                {project.mode} engine
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container border border-white/5 text-center">
              <span className="block font-technical text-[9px] text-on-surface-variant uppercase mb-1">Source Lang</span>
              <span className="block text-on-surface font-bold text-xs uppercase font-technical">
                {project.source_language}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container border border-white/5 text-center">
              <span className="block font-technical text-[9px] text-on-surface-variant uppercase mb-1">Credits used</span>
              <span className="block text-tertiary font-bold text-xs uppercase font-technical">
                {project.credits_used} credits
              </span>
            </div>
          </div>

          {/* Activity Logs timeline */}
          <section className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-base font-bold tracking-wider font-technical uppercase">Activity History</h3>
            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-white/5 pl-8">
              
              <div className="relative group">
                <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-emerald-400/20 border-2 border-emerald-400 z-10"></div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-xs font-bold">Project submitted and credit logged</span>
                  <span className="font-technical text-[9px] text-on-surface-variant">{new Date(project.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-0.5">Parameters validated. RLS checked. Sent pipeline.</p>
              </div>

              {project.translations?.map((t) => (
                <div key={t.id} className="relative group">
                  <div className={`absolute -left-[29px] top-1.5 w-3 h-3 rounded-full z-10 ${
                    t.status === 'completed' ? 'bg-emerald-400/20 border-2 border-emerald-400' :
                    t.status === 'failed' ? 'bg-red-500/20 border-2 border-red-500' : 'bg-primary/20 border-2 border-primary animate-pulse'
                  }`}></div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-xs font-bold">
                      {t.language} Translation: {t.status}
                    </span>
                    <span className="font-technical text-[9px] text-on-surface-variant">
                      {new Date(t.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {t.failure_message && (
                    <p className="text-[10px] text-red-400 mt-1 font-technical bg-red-500/5 p-2 rounded border border-red-500/10 max-w-sm">
                      Error: {t.failure_message}
                    </p>
                  )}
                  {t.status === 'completed' && (
                    <p className="text-[10px] text-emerald-400 mt-0.5 font-technical">
                      Voice cloned. Lip-sync matched. Captions rendered.
                    </p>
                  )}
                </div>
              ))}

            </div>
          </section>
        </div>

        {/* Right Column: Language Outputs cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold tracking-tight">Generated Output Assets</h3>
            <span className="font-technical text-[10px] bg-white/5 px-2.5 py-0.5 rounded-full text-on-surface-variant">
              {project.translations?.length || 0} Target(s)
            </span>
          </div>

          <div className="space-y-4">
            {project.translations?.map((translation) => {
              const imgPlaceholder = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=200&auto=format&fit=crop';
              return (
                <div 
                  key={translation.id}
                  className={`p-4 rounded-xl glass-panel border transition-all ${
                    translation.status === 'failed' ? 'border-red-500/20 bg-red-500/5' : 'border-white/5 hover:border-primary/20'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-14 bg-surface-container-high rounded overflow-hidden shrink-0 border border-white/5 relative">
                      <img 
                        src={imgPlaceholder} 
                        alt={translation.language} 
                        className="w-full h-full object-cover opacity-70"
                      />
                      {translation.status !== 'completed' && (
                        <div className="absolute inset-0 bg-[#020408]/75 flex items-center justify-center">
                          <span className={`material-symbols-outlined text-lg ${
                            translation.status === 'failed' ? 'text-red-500' : 'text-primary animate-spin'
                          }`}>
                            {translation.status === 'failed' ? 'error' : 'sync'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Meta & Download pipelines */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="font-bold text-sm block truncate">{translation.language}</span>
                        <span className={`font-technical text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          translation.status === 'completed' ? 'bg-emerald-400/20 text-emerald-400' :
                          translation.status === 'failed' ? 'bg-red-500/20 text-red-500' : 'bg-primary/10 text-primary'
                        }`}>
                          {translation.status}
                        </span>
                      </div>

                      {translation.status === 'completed' && (
                        <div className="flex flex-wrap gap-4 mt-2">
                          <a
                            href={translation.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-technical font-semibold text-primary hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">download</span>
                            <span>MP4 VIDEO</span>
                          </a>
                          <button
                            onClick={() => handleDownloadCaption(translation.id, 'srt')}
                            className="text-xs font-technical font-semibold text-on-surface-variant hover:text-white flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">description</span>
                            <span>SRT</span>
                          </button>
                          <button
                            onClick={() => handleDownloadCaption(translation.id, 'vtt')}
                            className="text-xs font-technical font-semibold text-on-surface-variant hover:text-white flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">description</span>
                            <span>VTT</span>
                          </button>
                        </div>
                      )}

                      {translation.status === 'failed' && (
                        <div className="space-y-2 mt-1">
                          <p className="text-[10px] text-red-400 font-technical leading-relaxed truncate max-w-[200px]">
                            {translation.failure_message || 'Transcriber error'}
                          </p>
                          <button
                            onClick={handleRetry}
                            className="px-3 py-1 bg-red-500/20 text-red-500 rounded text-[9px] font-technical uppercase font-bold hover:bg-red-500/30 transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">refresh</span>
                            <span>RETRY</span>
                          </button>
                        </div>
                      )}

                      {(translation.status === 'pending' || translation.status === 'running') && (
                        <div className="space-y-2 mt-2">
                          <div className="flex justify-between text-[9px] font-technical text-on-surface-variant">
                            <span>Processing...</span>
                            <span>72%</span>
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full w-[72%] rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
