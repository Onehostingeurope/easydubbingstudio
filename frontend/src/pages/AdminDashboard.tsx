import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
  plan: 'starter' | 'creator' | 'agency';
  credits_balance: number;
  created_at: string;
}

interface SystemStats {
  totalUsers: number;
  totalProjects: number;
  totalActiveJobs: number;
  totalCreditsUsed: number;
  planDistribution: Record<string, number>;
  projectStatusDistribution: Record<string, number>;
  totalTranslations: number;
  failedTranslations: number;
  completedTranslations: number;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Credit Adjustment State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [creditAmount, setCreditAmount] = useState<number>(10);
  const [creditAction, setCreditAction] = useState<'add' | 'remove' | 'set'>('add');
  const [updatingCredits, setUpdatingCredits] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function loadAdminData() {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;

      const headers = { 'Authorization': `Bearer ${session.access_token}` };

      // Fetch users
      const usersRes = await fetch('/_/backend/api/admin/users', { headers });
      const usersData = await usersRes.json();
      if (usersRes.ok && usersData.users) {
        setUsers(usersData.users);
      } else {
        throw new Error(usersData.error || 'Failed to fetch users list');
      }

      // Fetch stats
      const statsRes = await fetch('/_/backend/api/admin/system/stats', { headers });
      const statsData = await statsRes.json();
      if (statsRes.ok && statsData.stats) {
        setStats(statsData.stats);
      } else {
        throw new Error(statsData.error || 'Failed to fetch analytics statistics');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setUpdatingCredits(true);
    setSuccessMsg(null);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const response = await fetch(`/_/backend/api/admin/users/${selectedUser.id}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          amount: creditAmount,
          action: creditAction
        })
      });
      const result = await response.json();

      if (response.ok) {
        setSuccessMsg(result.message);
        // Refresh data
        await loadAdminData();
        // Close modal or reset selection
        setTimeout(() => {
          setSelectedUser(null);
          setSuccessMsg(null);
        }, 1500);
      } else {
        alert(result.error || 'Failed to adjust credits');
      }
    } catch (err: any) {
      alert(`Error adjusting credits: ${err.message}`);
    } finally {
      setUpdatingCredits(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 max-w-4xl mx-auto space-y-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h3 className="text-2xl font-bold text-[#e2e2e8]">Access Restricted</h3>
        <p className="text-on-surface-variant max-w-md mx-auto text-sm">
          {error.includes('Forbidden') 
            ? 'Only administrators with the elevated "admin" role in your Supabase Profiles database table can access this control panel.'
            : error}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      
      {/* Admin Title Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-white font-technical">Admin HQ</h2>
            <span className="px-2.5 py-0.5 rounded bg-tertiary/10 border border-tertiary/30 text-tertiary text-[10px] font-technical tracking-wider font-bold">
              ROOT ADMIN CONTROL
            </span>
          </div>
          <p className="text-on-surface-variant text-sm mt-1">
            Global system users, billing plans, credit allocations, and API telemetry logs.
          </p>
        </div>
        <button
          onClick={loadAdminData}
          className="glass-panel px-4 py-2 rounded-lg font-technical text-xs hover:bg-white/5 transition-all text-[#e2e2e8] flex items-center gap-2 border border-white/10"
        >
          <span className="material-symbols-outlined text-sm">sync</span>
          <span>REFRESH METRICS</span>
        </button>
      </div>

      {/* Analytics Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-xl border border-white/5">
            <p className="font-technical text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Total Users</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
              <p className="text-xs text-emerald-400 font-technical font-bold">Active</p>
            </div>
            <p className="text-[10px] text-outline mt-3">
              Starter: {stats.planDistribution?.starter || 0} • Creator: {stats.planDistribution?.creator || 0} • Agency: {stats.planDistribution?.agency || 0}
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl border border-white/5">
            <p className="font-technical text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Dubbing Projects</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-bold text-white">{stats.totalProjects}</p>
              <p className="text-xs text-tertiary font-technical">Global system</p>
            </div>
            <p className="text-[10px] text-outline mt-3">
              Completed: {stats.projectStatusDistribution?.completed || 0} • Running: {stats.totalActiveJobs} • Failed: {stats.projectStatusDistribution?.failed || 0}
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl border border-white/5">
            <p className="font-technical text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">HeyGen API Jobs</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-bold text-[#06B6D4]">{stats.totalTranslations}</p>
              <p className="text-xs text-[#06B6D4] font-technical">Total submits</p>
            </div>
            <p className="text-[10px] text-outline mt-3">
              Captions proxy cached: {stats.completedTranslations} completed
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl border border-white/5">
            <p className="font-technical text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Global System Cost</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-bold text-amber-400">{stats.totalCreditsUsed}</p>
              <p className="text-xs text-amber-500 font-technical">Credits consumed</p>
            </div>
            <p className="text-[10px] text-outline mt-3">
              Avg credits/project: {stats.totalProjects ? Math.round(stats.totalCreditsUsed / stats.totalProjects) : 0}
            </p>
          </div>
        </div>
      )}

      {/* Database Users Management Section */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-white font-technical">User Directory</h3>
            <p className="text-on-surface-variant text-xs mt-1">Modify credits and allocate system resource access controls.</p>
          </div>
          <span className="text-xs font-technical text-outline px-3 py-1 bg-white/5 rounded-full border border-white/5">
            {users.length} Registered Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="p-4 text-xs font-technical uppercase tracking-wider text-on-surface-variant">User Profile</th>
                <th className="p-4 text-xs font-technical uppercase tracking-wider text-on-surface-variant">Account Plan</th>
                <th className="p-4 text-xs font-technical uppercase tracking-wider text-on-surface-variant">Credits Balance</th>
                <th className="p-4 text-xs font-technical uppercase tracking-wider text-on-surface-variant">Registered Date</th>
                <th className="p-4 text-xs font-technical uppercase tracking-wider text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-all">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary text-xs font-bold font-technical">
                        {(user.full_name || user.email).substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-white flex items-center gap-2">
                          <span>{user.full_name || 'No Display Name'}</span>
                          {user.role === 'admin' && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-technical font-bold bg-[#4D8EFF]/10 border border-[#4D8EFF]/30 text-[#4D8EFF]">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-on-surface-variant font-technical mt-0.5">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-technical uppercase font-bold tracking-wider ${
                      user.plan === 'agency' ? 'bg-[#c084fc]/10 text-[#c084fc] border border-[#c084fc]/20' :
                      user.plan === 'creator' ? 'bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20' :
                      'bg-outline/10 text-on-surface-variant border border-white/5'
                    }`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="p-4 font-technical font-bold text-sm">
                    <span className="text-[#06B6D4]">{user.credits_balance}</span>
                    <span className="text-outline text-[10px] ml-1">Credits</span>
                  </td>
                  <td className="p-4 text-xs font-technical text-outline">
                    {new Date(user.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="px-3 py-1.5 rounded-lg border border-primary/30 hover:border-primary text-primary hover:bg-primary/5 text-xs font-technical transition-all active:scale-95 duration-100"
                    >
                      Adjust Credits
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit adjustment overlay modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-[#020408]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-white/5 space-y-6 flex flex-col relative animate-fade-in">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div>
              <h3 className="text-lg font-bold text-white font-technical">Adjust Account Credits</h3>
              <p className="text-on-surface-variant text-xs mt-1">
                Allocating credits to: <span className="text-primary font-bold">{selectedUser.email}</span>
              </p>
            </div>

            {successMsg ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-technical rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>{successMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleAdjustCredits} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-technical text-on-surface-variant uppercase tracking-widest">
                    Select Operation Action
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCreditAction('add')}
                      className={`py-2 px-3 rounded-lg text-xs font-technical font-bold border transition-all ${
                        creditAction === 'add'
                          ? 'bg-primary/10 border-primary text-primary font-bold'
                          : 'bg-surface-container-low border-white/5 text-on-surface-variant hover:bg-white/5'
                      }`}
                    >
                      ADD CREDITS
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreditAction('remove')}
                      className={`py-2 px-3 rounded-lg text-xs font-technical font-bold border transition-all ${
                        creditAction === 'remove'
                          ? 'bg-red-500/10 border-red-500 text-red-400 font-bold'
                          : 'bg-surface-container-low border-white/5 text-on-surface-variant hover:bg-white/5'
                      }`}
                    >
                      DEDUCT
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreditAction('set')}
                      className={`py-2 px-3 rounded-lg text-xs font-technical font-bold border transition-all ${
                        creditAction === 'set'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                          : 'bg-surface-container-low border-white/5 text-on-surface-variant hover:bg-white/5'
                      }`}
                    >
                      SET TOTAL
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-technical text-on-surface-variant uppercase tracking-widest">
                    Credit Amount Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#020408]/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary font-technical"
                    placeholder="Enter numeric value..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={updatingCredits}
                  className="w-full primary-btn text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 duration-100"
                >
                  {updatingCredits ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      <span>SAVE CREDIT ADJUSTMENTS</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
