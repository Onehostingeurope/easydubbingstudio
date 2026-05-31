import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function NewProject() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  // Supported target languages fetched from HeyGen
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);

  // Project configuration state
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState<'url' | 'upload'>('url');
  const [sourceVideoUrl, setSourceVideoUrl] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('English (US)');
  const [autoDetect, setAutoDetect] = useState(true);
  const [outputLanguages, setOutputLanguages] = useState<string[]>(['Spanish']);
  const [mode, setMode] = useState<'speed' | 'precision'>('speed');
  
  // Enhancement Toggles
  const [enableCaption, setEnableCaption] = useState(true);
  const [translateAudioOnly, setTranslateAudioOnly] = useState(false);
  const [enableSpeechEnhancement, setEnableSpeechEnhancement] = useState(true);
  const [disableMusicTrack, setDisableMusicTrack] = useState(false);
  const [enableDynamicDuration] = useState(true);
  const [proofreadEnabled, setProofreadEnabled] = useState(false);

  // Credit cost estimates
  const costPerLang = mode === 'precision' ? 20 : 10;
  const totalCost = costPerLang * outputLanguages.length;

  useEffect(() => {
    async function loadLanguages() {
      try {
        const response = await fetch('/api/heygen/languages');
        const data = await response.json();
        if (response.ok && data.languages) {
          setSupportedLanguages(data.languages);
        }
      } catch (err) {
        console.error('Failed to load supported languages from HeyGen:', err);
      }
    }
    loadLanguages();
  }, []);

  const handleAddLanguage = (lang: string) => {
    if (lang && !outputLanguages.includes(lang)) {
      setOutputLanguages([...outputLanguages, lang]);
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setOutputLanguages(outputLanguages.filter(l => l !== lang));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('Please provide a project title.');
      return;
    }
    if (sourceType === 'url' && !sourceVideoUrl) {
      alert('Please paste a public video URL.');
      return;
    }

    setSubmitting(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          title,
          source_type: sourceType,
          source_video_url: sourceType === 'url' ? sourceVideoUrl : null,
          source_asset_id: sourceType === 'upload' ? 'dummy_upload_asset_id' : null,
          source_language: autoDetect ? 'auto-detect' : sourceLanguage,
          mode,
          output_languages: outputLanguages,
          enable_caption: enableCaption,
          translate_audio_only: translateAudioOnly,
          enable_speech_enhancement: enableSpeechEnhancement,
          disable_music_track: disableMusicTrack,
          enable_dynamic_duration: enableDynamicDuration,
          proofread_enabled: proofreadEnabled
        })
      });

      const result = await response.json();
      if (response.ok && result.projectId) {
        navigate(`/projects/${result.projectId}`);
      } else {
        alert(`Error submitting job: ${result.error || 'Unknown error'}`);
        setSubmitting(false);
      }
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 font-body relative pb-24">
      {/* Submitting Loading overlay overlay overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 bg-[#020408]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-full border-t-2 border-primary border-r-2 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-b-2 border-tertiary border-l-2 animate-spin-reverse"></div>
            <span className="material-symbols-outlined text-4xl text-primary absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pulse-processing">
              movie_edit
            </span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">Transcribing and Uploading</h3>
          <p className="text-on-surface-variant text-sm max-w-sm">
            AI engine is analyzing phonemes, compiling parameters and splitting your video translation queues.
          </p>
        </div>
      )}

      {/* Header title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">New Dubbing Project</h2>
        <p className="text-on-surface-variant text-sm mt-1">Translate existing videos utilizing generative lip-sync engines.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form Settings */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Media Input Card */}
          <section className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-tertiary">
              <span className="material-symbols-outlined text-xl">cloud_upload</span>
              <span>Media Source</span>
            </h3>

            {/* Selector */}
            <div className="flex gap-4 border-b border-white/5 pb-4">
              <button
                type="button"
                onClick={() => setSourceType('url')}
                className={`px-4 py-2 rounded-lg font-technical text-xs transition-all ${
                  sourceType === 'url' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-on-surface-variant hover:bg-white/5'
                }`}
              >
                PUBLIC VIDEO URL
              </button>
              <button
                type="button"
                onClick={() => setSourceType('upload')}
                className={`px-4 py-2 rounded-lg font-technical text-xs transition-all ${
                  sourceType === 'upload' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-on-surface-variant hover:bg-white/5'
                }`}
              >
                UPLOAD VIDEO FILE
              </button>
            </div>

            {sourceType === 'url' ? (
              <div className="space-y-2">
                <label className="block font-technical text-[10px] text-on-surface-variant uppercase tracking-wider">
                  Paste video URL (YouTube, Vimeo, Cloud MP4)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    link
                  </span>
                  <input
                    type="text"
                    value={sourceVideoUrl}
                    onChange={(e) => setSourceVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-surface-container-low border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-on-surface focus:outline-none focus:border-tertiary focus:ring-4 focus:ring-tertiary/10"
                  />
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-outline-variant hover:border-tertiary rounded-xl p-10 flex flex-col items-center justify-center bg-surface/40 transition-all cursor-pointer group">
                <div className="h-14 w-14 rounded-full bg-surface-container-high flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant">video_file</span>
                </div>
                <p className="text-sm font-medium">Drag & Drop files here</p>
                <p className="text-[10px] text-on-surface-variant mt-1 uppercase font-technical">MP4, MOV (Max 200MB / 2 Hours)</p>
                <button type="button" className="mt-4 px-4 py-2 bg-surface-variant text-xs font-technical rounded-lg font-medium hover:bg-surface-bright transition-colors">
                  BROWSE FILES
                </button>
              </div>
            )}
          </section>

          {/* Configuration Card */}
          <section className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-tertiary">
              <span className="material-symbols-outlined text-xl">settings_input_component</span>
              <span>Configuration</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2 space-y-2">
                <label className="block font-technical text-[10px] text-on-surface-variant uppercase tracking-wider">
                  Project Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g. Global Product Launch Promotion"
                  className="w-full bg-surface-container-low border border-white/10 rounded-xl py-3 px-4 text-on-surface focus:outline-none focus:border-tertiary focus:ring-4 focus:ring-tertiary/10"
                />
              </div>

              {/* Source language */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-technical text-[10px] text-on-surface-variant uppercase tracking-wider">
                    Source Language
                  </label>
                  <button
                    type="button"
                    onClick={() => setAutoDetect(!autoDetect)}
                    className="flex items-center gap-1.5"
                  >
                    <span className="text-[9px] font-technical uppercase font-bold text-on-surface-variant">Auto-detect</span>
                    <div className={`w-8 h-4 rounded-full relative ${autoDetect ? 'bg-tertiary' : 'bg-surface-variant'}`}>
                      <div className={`absolute top-0.5 h-3 w-3 bg-white rounded-full transition-all ${autoDetect ? 'right-0.5' : 'left-0.5'}`}></div>
                    </div>
                  </button>
                </div>
                {!autoDetect && (
                  <select
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    className="w-full bg-surface-container-low border border-white/10 rounded-xl py-3 px-4 text-on-surface focus:outline-none focus:border-tertiary"
                  >
                    <option>English (US)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                )}
              </div>

              {/* Output Languages */}
              <div className="space-y-2">
                <label className="block font-technical text-[10px] text-on-surface-variant uppercase tracking-wider">
                  Output Languages (Multi-select)
                </label>
                <select
                  onChange={(e) => handleAddLanguage(e.target.value)}
                  value=""
                  className="w-full bg-surface-container-low border border-white/10 rounded-xl py-3 px-4 text-on-surface focus:outline-none focus:border-tertiary"
                >
                  <option value="">Select language to add...</option>
                  {supportedLanguages.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                  {supportedLanguages.length === 0 && (
                    <>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                      <option>Mandarin</option>
                      <option>Japanese</option>
                      <option>Korean</option>
                    </>
                  )}
                </select>

                {/* Selected Languages Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {outputLanguages.map(lang => (
                    <span 
                      key={lang}
                      className="bg-primary/20 text-primary text-[10px] font-technical font-semibold px-2 py-1 rounded-md border border-primary/30 flex items-center gap-1.5"
                    >
                      <span>{lang}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveLanguage(lang)}
                        className="material-symbols-outlined text-[10px] hover:text-white"
                      >
                        close
                      </button>
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </section>

          {/* Engine Selector */}
          <section className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-tertiary">
              <span className="material-symbols-outlined text-xl">bolt</span>
              <span>Dubbing Engine</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="engineMode"
                  checked={mode === 'speed'}
                  onChange={() => setMode('speed')}
                  className="hidden peer"
                />
                <div className="p-4 rounded-xl bg-surface-container-low border border-white/10 peer-checked:border-tertiary peer-checked:bg-tertiary-container/5 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-10 w-10 rounded-lg bg-surface-variant flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined">rocket</span>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      mode === 'speed' ? 'border-tertiary' : 'border-white/10'
                    }`}>
                      {mode === 'speed' && <div className="h-2.5 w-2.5 bg-tertiary rounded-full"></div>}
                    </div>
                  </div>
                  <h4 className="font-bold text-sm">Speed Mode</h4>
                  <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed font-technical">
                    Processed instantly. Low latency renders. Best for drafts and quick social video updates.
                  </p>
                </div>
              </label>

              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="engineMode"
                  checked={mode === 'precision'}
                  onChange={() => setMode('precision')}
                  className="hidden peer"
                />
                <div className="p-4 rounded-xl bg-surface-container-low border border-white/10 peer-checked:border-tertiary peer-checked:bg-tertiary-container/5 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-10 w-10 rounded-lg bg-surface-variant flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">high_quality</span>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      mode === 'precision' ? 'border-tertiary' : 'border-white/10'
                    }`}>
                      {mode === 'precision' && <div className="h-2.5 w-2.5 bg-tertiary rounded-full"></div>}
                    </div>
                  </div>
                  <h4 className="font-bold text-sm">Precision Mode</h4>
                  <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed font-technical">
                    Cinema-grade generative lip-sync rendering. Blends dubbed speech animations seamlessly.
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* Options Enhancements */}
          <section className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-tertiary">
              <span className="material-symbols-outlined text-xl">construction</span>
              <span>Enhancements</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-lg">closed_caption</span>
                  <span className="text-xs font-semibold">Generate captions</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableCaption(!enableCaption)}
                  className={`w-10 h-5 bg-surface-variant rounded-full relative cursor-pointer transition-colors ${
                    enableCaption ? 'bg-primary' : 'bg-surface-variant'
                  }`}
                >
                  <div className={`absolute h-4 w-4 bg-white rounded-full top-0.5 transition-all ${
                    enableCaption ? 'right-0.5' : 'left-0.5'
                  }`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-lg">music_off</span>
                  <span className="text-xs font-semibold">Remove background music</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDisableMusicTrack(!disableMusicTrack)}
                  className={`w-10 h-5 bg-surface-variant rounded-full relative cursor-pointer transition-colors ${
                    disableMusicTrack ? 'bg-primary' : 'bg-surface-variant'
                  }`}
                >
                  <div className={`absolute h-4 w-4 bg-white rounded-full top-0.5 transition-all ${
                    disableMusicTrack ? 'right-0.5' : 'left-0.5'
                  }`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-lg">mic</span>
                  <span className="text-xs font-semibold">Translate audio only</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTranslateAudioOnly(!translateAudioOnly)}
                  className={`w-10 h-5 bg-surface-variant rounded-full relative cursor-pointer transition-colors ${
                    translateAudioOnly ? 'bg-primary' : 'bg-surface-variant'
                  }`}
                >
                  <div className={`absolute h-4 w-4 bg-white rounded-full top-0.5 transition-all ${
                    translateAudioOnly ? 'right-0.5' : 'left-0.5'
                  }`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-lg">equalizer</span>
                  <span className="text-xs font-semibold">Speech enhancement</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableSpeechEnhancement(!enableSpeechEnhancement)}
                  className={`w-10 h-5 bg-surface-variant rounded-full relative cursor-pointer transition-colors ${
                    enableSpeechEnhancement ? 'bg-primary' : 'bg-surface-variant'
                  }`}
                >
                  <div className={`absolute h-4 w-4 bg-white rounded-full top-0.5 transition-all ${
                    enableSpeechEnhancement ? 'right-0.5' : 'left-0.5'
                  }`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between group md:col-span-2 border-t border-white/5 pt-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-lg">spellcheck</span>
                  <span className="text-xs font-semibold">Proofread subtitles manually before rendering</span>
                </div>
                <button
                  type="button"
                  onClick={() => setProofreadEnabled(!proofreadEnabled)}
                  className={`w-10 h-5 bg-surface-variant rounded-full relative cursor-pointer transition-colors ${
                    proofreadEnabled ? 'bg-primary' : 'bg-surface-variant'
                  }`}
                >
                  <div className={`absolute h-4 w-4 bg-white rounded-full top-0.5 transition-all ${
                    proofreadEnabled ? 'right-0.5' : 'left-0.5'
                  }`}></div>
                </button>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column: Estimate cost sidebar */}
        <div className="lg:col-span-4 sticky top-[104px] space-y-6">
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
            <div className="bg-white/5 p-4 border-b border-white/5">
              <h3 className="font-bold text-sm tracking-wide font-technical uppercase text-on-surface">Project Summary</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-on-surface-variant text-[10px] font-technical uppercase">Estimated Cost</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold text-tertiary">{totalCost}</span>
                    <span className="text-xs font-semibold text-on-surface-variant font-technical">Credits</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded font-technical uppercase">Studio Pass</p>
                </div>
              </div>

              <div className="h-px bg-white/5"></div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                  <div>
                    <p className="text-[9px] text-on-surface-variant font-technical uppercase">Est. Render Time</p>
                    <p className="text-xs font-medium">~{outputLanguages.length * 6} minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-primary">translate</span>
                  <div>
                    <p className="text-[9px] text-on-surface-variant font-technical uppercase">Output Targets</p>
                    <p className="text-xs font-medium">{outputLanguages.join(', ') || 'None selected'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-primary">analytics</span>
                  <div>
                    <p className="text-[9px] text-on-surface-variant font-technical uppercase">Engine Mode</p>
                    <p className="text-xs font-medium uppercase font-technical text-tertiary">{mode} mode</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full primary-btn py-4 rounded-xl font-bold text-white shadow-lg hover:shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs font-technical uppercase"
              >
                <span className="material-symbols-outlined text-base">auto_fix_high</span>
                <span>Generate Dubbed Video</span>
              </button>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
