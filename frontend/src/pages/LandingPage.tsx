import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'How accurate is the voice preservation?',
      a: 'Our proprietary neural voice cloning captures 99.9% of the original speaker\'s emotional range and timbre. The AI analyzes subtle pitch shifts and breathing patterns to recreate a voice that is virtually indistinguishable from the original across 120+ languages.'
    },
    {
      q: 'Does it work with music in the background?',
      a: 'Yes! Our advanced audio separation technology isolates speech from background music and sound effects, translates the speech, and then seamlessly remasters it with the original background audio to maintain high production quality.'
    },
    {
      q: 'What is the turnaround time?',
      a: 'For most videos, the processing time is roughly 1.5x the video length. A 10-minute video will typically be dubbed, lip-synced, and ready for review in about 15 minutes.'
    }
  ];

  return (
    <div className="bg-[#020408] text-[#e2e2e8] font-body selection:bg-primary/30 min-h-screen">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-16 h-20 bg-surface/70 backdrop-blur-xl border-b border-white/5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-2xl text-primary tracking-tight">Easy Dubbing</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a className="text-primary font-bold border-b-2 border-primary pb-1 font-technical text-xs" href="#product">PRODUCT</a>
          <a className="text-on-surface-variant hover:text-on-surface transition-colors font-technical text-xs" href="#features">FEATURES</a>
          <a className="text-on-surface-variant hover:text-on-surface transition-colors font-technical text-xs" href="#pricing">PRICING</a>
        </nav>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/login')} className="text-on-surface-variant hover:text-on-surface font-technical text-xs transition-colors px-4 py-2">
            LOGIN
          </button>
          <button onClick={() => navigate('/register')} className="px-6 py-2 rounded-lg primary-gradient text-[#002e6a] font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
            START DUBBING
          </button>
        </div>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section id="product" className="relative overflow-hidden pt-20 pb-32 px-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(77,142,255,0.12)_0%,transparent_60%)] pointer-events-none"></div>
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container border border-white/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              <span className="font-technical text-[10px] text-tertiary uppercase tracking-wider">New: Neural Lip-Sync 2.0</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold max-w-4xl mx-auto mb-6 tracking-tight leading-tight">
              Dub Any Video Into <span className="text-primary bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Any Language</span>
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
              AI video dubbing with voice preservation, lip-sync, subtitles, and multilingual export for creators, agencies, and businesses.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-8 py-4 rounded-xl primary-gradient text-[#002e6a] font-bold text-base shadow-xl hover:brightness-110 active:scale-95 transition-all">
                Start Dubbing Now
              </button>
              <a href="#how-it-works" className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel text-on-surface font-bold text-base flex items-center justify-center gap-2 hover:bg-white/10 transition-all border border-white/10">
                <span className="material-symbols-outlined">play_circle</span> Watch Demo
              </a>
            </div>

            {/* Dashboard Mockup */}
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 blur-2xl opacity-40"></div>
              <div className="relative glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img 
                  alt="Dashboard Preview" 
                  className="w-full object-cover opacity-90 aspect-[16/10]" 
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1280&auto=format&fit=crop"
                />
                {/* Overlay components for high-end UI feel */}
                <div className="absolute top-10 left-10 p-5 glass-panel rounded-xl w-64 text-left border border-white/10 hidden md:block">
                  <p className="font-technical text-[10px] text-primary mb-2 uppercase tracking-widest font-semibold">PROCESSING JOB</p>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-primary to-tertiary"></div>
                  </div>
                  <p className="font-technical text-[10px] text-on-surface-variant mt-2">Lip-Syncing... 74%</p>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-28 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-primary text-3xl">record_voice_over</span>
                <span className="font-technical text-[10px] uppercase tracking-wider">Voice Preservation</span>
              </div>
              <div className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-primary text-3xl">face</span>
                <span className="font-technical text-[10px] uppercase tracking-wider">Mouth Lip-Sync</span>
              </div>
              <div className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-primary text-3xl">subtitles</span>
                <span className="font-technical text-[10px] uppercase tracking-wider">Generate Subtitles</span>
              </div>
              <div className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-primary text-3xl">language</span>
                <span className="font-technical text-[10px] uppercase tracking-wider">Multilingual Export</span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 px-6 bg-surface-container-low">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Master Your Workflow</h2>
              <p className="text-on-surface-variant font-medium">From raw video to localized masterpiece in four simple steps.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-primary/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                    <span className="material-symbols-outlined text-2xl">upload</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">1. Upload Video</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">Drop your MP4 file or paste a public YouTube video URL.</p>
                </div>
              </div>
              {/* Step 2 */}
              <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-primary/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                    <span className="material-symbols-outlined text-2xl">translate</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">2. Choose Languages</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">Select from 40+ source & target languages to translate.</p>
                </div>
              </div>
              {/* Step 3 */}
              <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-primary/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                    <span className="material-symbols-outlined text-2xl">settings_voice</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">3. Set Engine Mode</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">Choose Speed Mode for drafts, or Precision Mode for final cinema render.</p>
                </div>
              </div>
              {/* Step 4 */}
              <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-primary/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                    <span className="material-symbols-outlined text-2xl">download</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">4. Download Files</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">Export high-bitrate dubbed MP4s, burned captions, or SRT/VTT subtitles.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              <div className="md:col-span-3 glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col justify-end min-h-[260px] group border border-white/5 hover:border-tertiary/20">
                <div className="absolute top-8 right-8">
                  <span className="material-symbols-outlined text-5xl text-primary opacity-30 group-hover:opacity-100 transition-opacity">auto_awesome</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">AI Voice Translation</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">Neural cloning captures the exact timbre, emotion, and cadence of the original speaker across 120 dialects.</p>
              </div>

              <div className="md:col-span-3 glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col justify-end min-h-[260px] group border border-white/5 hover:border-primary/20">
                <div className="absolute top-8 right-8">
                  <span className="material-symbols-outlined text-5xl text-tertiary opacity-30 group-hover:opacity-100 transition-opacity">face</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Precise Lip-Sync</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">Our proprietary model re-animates mouth movements to match the new audio perfectly, eliminating the "dubbed" look.</p>
              </div>

              <div className="md:col-span-2 glass-panel p-8 rounded-3xl border border-white/5">
                <span className="material-symbols-outlined text-tertiary text-3xl mb-4">dynamic_feed</span>
                <h3 className="text-lg font-bold mb-2">Batch Export</h3>
                <p className="text-on-surface-variant text-xs leading-relaxed">Translate videos into multiple languages concurrently in a single dashboard project submission.</p>
              </div>

              <div className="md:col-span-2 glass-panel p-8 rounded-3xl border border-white/5">
                <span className="material-symbols-outlined text-primary text-3xl mb-4">edit_note</span>
                <h3 className="text-lg font-bold mb-2">Subtitle Editor</h3>
                <p className="text-on-surface-variant text-xs leading-relaxed">Choose to proofread and approve transcripts manually before triggering the final translation rendering stage.</p>
              </div>

              <div className="md:col-span-2 glass-panel p-8 rounded-3xl border border-white/5">
                <span className="material-symbols-outlined text-secondary text-3xl mb-4">cloud_done</span>
                <h3 className="text-lg font-bold mb-2">Speech Separation</h3>
                <p className="text-on-surface-variant text-xs leading-relaxed">Isolate voice audio tracks dynamically, filter ambient background music, and master dialogues cleanly.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-24 px-6 bg-surface-container-lowest overflow-hidden">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1">
              <span className="font-technical text-[10px] text-primary mb-4 block uppercase tracking-widest font-semibold">DOMINATE EVERY CHANNEL</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">One Video, <span className="text-tertiary bg-gradient-to-r from-tertiary to-primary bg-clip-text text-transparent font-semibold">Billions</span> of Potential Viewers</h2>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-primary">
                    <span className="material-symbols-outlined">video_library</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-base">YouTube Content</h4>
                    <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">Reach global audiences with multi-audio tracks. Same content, new markets.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-primary">
                    <span className="material-symbols-outlined">school</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-base">Online Courses</h4>
                    <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">Educate the world by translating your masterclasses into every student's native tongue.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-primary">
                    <span className="material-symbols-outlined">campaign</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-base">Global Marketing</h4>
                    <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">Scale ad campaigns across continents with localized voices and cultural nuance.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="flex-1 relative w-full">
              <div className="absolute -inset-10 bg-gradient-to-br from-primary/10 to-tertiary/10 opacity-30 blur-3xl rounded-full"></div>
              <div className="relative grid grid-cols-2 gap-4">
                <div className="space-y-4 pt-12">
                  <img className="rounded-2xl border border-white/5 shadow-lg w-full object-cover" src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=300" alt="Tech workspace"/>
                  <img className="rounded-2xl border border-white/5 shadow-lg w-full object-cover" src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=300" alt="Coding on laptop"/>
                </div>
                <div className="space-y-4">
                  <img className="rounded-2xl border border-white/5 shadow-lg w-full object-cover" src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=300" alt="Screen display data"/>
                  <img className="rounded-2xl border border-white/5 shadow-lg w-full object-cover" src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=300" alt="Editing software screen"/>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section id="pricing" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Pricing for Every Scale</h2>
              <p className="text-on-surface-variant font-medium">Simple, transparent plans designed to grow with your content output.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Starter */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between border border-white/5">
                <div>
                  <h4 className="font-technical text-xs text-primary mb-4 uppercase tracking-widest font-semibold">STARTER</h4>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">$29</span>
                    <span className="text-on-surface-variant text-sm">/mo</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span> 30 credits /mo
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span> Max 3 languages / project
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span> Speed Mode Only
                    </li>
                  </ul>
                </div>
                <button onClick={() => navigate('/register')} className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 font-semibold text-xs transition-all">Select Plan</button>
              </div>

              {/* Creator */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between border-primary/40 border-2 relative">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 primary-gradient text-[#002e6a] text-[10px] font-bold rounded-full uppercase tracking-wider">MOST POPULAR</div>
                <div>
                  <h4 className="font-technical text-xs text-primary mb-4 uppercase tracking-widest font-semibold">CREATOR</h4>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">$79</span>
                    <span className="text-on-surface-variant text-sm">/mo</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-2 text-xs font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span> 150 credits /mo
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span> Max 10 languages / project
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span> Precision Mode Enabled
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span> Subtitles Proofreader
                    </li>
                  </ul>
                </div>
                <button onClick={() => navigate('/register')} className="w-full py-3 rounded-xl primary-gradient text-[#002e6a] font-bold text-xs shadow-lg shadow-primary/20 hover:brightness-110 transition-all">Select Plan</button>
              </div>

              {/* Agency */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between border border-white/5">
                <div>
                  <h4 className="font-technical text-xs text-primary mb-4 uppercase tracking-widest font-semibold">AGENCY</h4>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">$199</span>
                    <span className="text-on-surface-variant text-sm">/mo</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span> 500 credits /mo
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span> Max 20 languages / project
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span> Precision + Proofread
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span> Priority rendering queues
                    </li>
                  </ul>
                </div>
                <button onClick={() => navigate('/register')} className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 font-semibold text-xs transition-all">Select Plan</button>
              </div>

              {/* Enterprise */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between border border-white/5">
                <div>
                  <h4 className="font-technical text-xs text-primary mb-4 uppercase tracking-widest font-semibold">ENTERPRISE</h4>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">Custom</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span> Unlimited credit pools
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span> Custom Voice Fine-tuning
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span> Dedicated account manager
                    </li>
                  </ul>
                </div>
                <button onClick={() => navigate('/register')} className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 font-semibold text-xs transition-all">Contact Sales</button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="py-24 px-6 bg-surface-container-low">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight">Common Questions</h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div key={idx} className="glass-panel rounded-2xl overflow-hidden border border-white/5">
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-6 text-left flex justify-between items-center font-bold text-sm md:text-base focus:outline-none"
                    >
                      <span>{faq.q}</span>
                      <span className="material-symbols-outlined transition-transform duration-300">
                        {isOpen ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                    <div 
                      className={`px-6 pb-6 text-on-surface-variant text-sm transition-all duration-300 ${
                        isOpen ? 'block opacity-100' : 'hidden opacity-0'
                      }`}
                    >
                      {faq.a}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(173,198,255,0.08)_0%,transparent_70%)] pointer-events-none"></div>
          <div className="max-w-5xl mx-auto text-center relative z-10 glass-panel p-10 md:p-16 rounded-[40px] border border-white/10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Ready to go global?</h2>
            <p className="text-on-surface-variant text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Join 5,000+ creators and brands who use Easy Dubbing to break the language barrier every single day.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-10 py-4.5 rounded-xl primary-gradient text-[#002e6a] font-bold text-base shadow-xl hover:brightness-110 active:scale-95 transition-all">
                Get Started for Free
              </button>
              <a href="#features" className="w-full sm:w-auto px-10 py-4.5 rounded-xl glass-panel text-on-surface font-bold text-base hover:bg-white/10 transition-all border border-white/10">
                View All Features
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-20 px-6 md:px-16 grid grid-cols-2 md:grid-cols-4 gap-12 bg-surface-container-lowest border-t border-white/5">
        <div className="col-span-2 md:col-span-1">
          <span className="font-semibold text-xl text-primary block mb-4 tracking-tight">Easy Dubbing</span>
          <p className="text-on-surface-variant text-xs max-w-xs leading-relaxed">
            Cinematic precision AI dubbing for the modern video era. Break boundaries, not budgets.
          </p>
        </div>
        <div>
          <h5 className="text-primary font-bold font-technical text-xs tracking-wider uppercase mb-4">Product</h5>
          <ul className="space-y-3 text-xs text-on-surface-variant font-technical">
            <li><a className="hover:text-tertiary transition-colors" href="#product">Features</a></li>
            <li><a className="hover:text-tertiary transition-colors" href="#pricing">Pricing</a></li>
            <li><a className="hover:text-tertiary transition-colors" href="#pricing">Enterprise</a></li>
          </ul>
        </div>
        <div>
          <h5 className="text-primary font-bold font-technical text-xs tracking-wider uppercase mb-4">Resources</h5>
          <ul className="space-y-3 text-xs text-on-surface-variant font-technical">
            <li><a className="hover:text-tertiary transition-colors" href="#">Documentation</a></li>
            <li><a className="hover:text-tertiary transition-colors" href="#">Help Center</a></li>
            <li><a className="hover:text-tertiary transition-colors" href="#">System Status</a></li>
          </ul>
        </div>
        <div>
          <h5 className="text-primary font-bold font-technical text-xs tracking-wider uppercase mb-4">Company</h5>
          <ul className="space-y-3 text-xs text-on-surface-variant font-technical">
            <li><a className="hover:text-tertiary transition-colors" href="#">About Us</a></li>
            <li><a className="hover:text-tertiary transition-colors" href="#">Privacy Terms</a></li>
            <li><p className="text-[10px] text-on-surface-variant/50 mt-8">© 2026 Easy Dubbing AI. Cinematic precision.</p></li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
