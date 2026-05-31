import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Billing() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          setProfile(data);
        }
      } catch (err) {
        console.error('Failed to load profile details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleCheckout = async (plan: 'creator' | 'agency') => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      
      // Simulate checkout session route backend callback
      const response = await fetch('/_/backend/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          type: 'checkout.session.completed',
          data: {
            object: {
              customer_details: { email: profile?.email },
              metadata: { plan },
              id: `cs_test_${Date.now()}`
            }
          }
        })
      });

      if (response.ok) {
        alert(`Successfully upgraded to the ${plan} subscription! The credit balance has been topped up.`);
        window.location.reload();
      } else {
        alert('Payment portal simulation failed. Please try again.');
      }
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 font-body relative pb-24">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing & Plans</h2>
        <p className="text-on-surface-variant text-sm mt-1">Upgrade your tier or buy one-off rendering credits.</p>
      </div>

      {/* Credit status panel */}
      <section className="glass-panel p-6 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gradient-to-br from-primary/5 to-tertiary/5">
        <div>
          <h3 className="text-lg font-bold">Your Balance Status</h3>
          <p className="text-on-surface-variant text-xs mt-1">Active subscription and ledger credits remaining.</p>
          <div className="flex items-baseline gap-1 mt-6">
            <span className="text-5xl font-bold text-tertiary">{profile?.credits_balance ?? 0}</span>
            <span className="text-sm text-on-surface-variant font-technical uppercase">Credits Remaining</span>
          </div>
        </div>

        <div className="space-y-3 font-technical text-xs border-l border-white/5 pl-8 hidden md:block">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">CURRENT SUBSCRIPTION</span>
            <span className="text-primary font-bold uppercase">{profile?.plan || 'Starter'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">REGISTERED EMAIL</span>
            <span className="text-on-surface">{profile?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">ROLE CLASSIFICATION</span>
            <span className="text-on-surface font-semibold uppercase">{profile?.role}</span>
          </div>
        </div>
      </section>

      {/* Plans List */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold tracking-tight">Select Subscription Level</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Starter Plan */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-white/5 opacity-80">
            <div>
              <span className="font-technical text-[10px] text-primary uppercase font-bold tracking-widest block mb-4">STARTER TIER</span>
              <div className="mb-6">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-on-surface-variant text-xs"> /mo</span>
              </div>
              <ul className="space-y-3 text-xs mb-8">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  <span>30 credits /mo allocated</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  <span>Max 3 languages / project</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  <span>Speed engine mode only</span>
                </li>
              </ul>
            </div>
            {profile?.plan === 'starter' ? (
              <span className="w-full text-center py-2.5 rounded-xl border border-primary/40 text-primary text-xs font-technical font-semibold uppercase">ACTIVE LEVEL</span>
            ) : (
              <button disabled className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant text-xs font-technical uppercase">Starter Plan</button>
            )}
          </div>

          {/* Creator Plan */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between border-2 border-primary/40 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 primary-gradient text-[#002e6a] text-[10px] font-bold rounded-full uppercase tracking-wider">POPULAR TIER</div>
            <div>
              <span className="font-technical text-[10px] text-primary uppercase font-bold tracking-widest block mb-4">CREATOR TIER</span>
              <div className="mb-6">
                <span className="text-4xl font-bold">$79</span>
                <span className="text-on-surface-variant text-xs"> /mo</span>
              </div>
              <ul className="space-y-3 text-xs mb-8">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  <span>150 credits /mo allocated</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  <span>Max 10 languages / project</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  <span>Precision engine mode</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  <span>Subtitles manual editor</span>
                </li>
              </ul>
            </div>
            {profile?.plan === 'creator' ? (
              <span className="w-full text-center py-2.5 rounded-xl border border-primary/40 text-primary text-xs font-technical font-semibold uppercase font-bold">ACTIVE LEVEL</span>
            ) : (
              <button 
                onClick={() => handleCheckout('creator')}
                className="w-full primary-gradient text-[#002e6a] py-2.5 rounded-xl font-bold text-xs font-technical hover:brightness-110 active:scale-95 transition-all shadow"
              >
                SELECT CREATOR
              </button>
            )}
          </div>

          {/* Agency Plan */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-white/5">
            <div>
              <span className="font-technical text-[10px] text-primary uppercase font-bold tracking-widest block mb-4">AGENCY TIER</span>
              <div className="mb-6">
                <span className="text-4xl font-bold">$199</span>
                <span className="text-on-surface-variant text-xs"> /mo</span>
              </div>
              <ul className="space-y-3 text-xs mb-8">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  <span>500 credits /mo allocated</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  <span>Max 20 languages / project</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  <span>Precision + manual editor</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  <span>Priority render lines</span>
                </li>
              </ul>
            </div>
            {profile?.plan === 'agency' ? (
              <span className="w-full text-center py-2.5 rounded-xl border border-primary/40 text-primary text-xs font-technical font-semibold uppercase font-bold">ACTIVE LEVEL</span>
            ) : (
              <button 
                onClick={() => handleCheckout('agency')}
                className="w-full py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-technical font-semibold uppercase active:scale-95 transition-all"
              >
                SELECT AGENCY
              </button>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
