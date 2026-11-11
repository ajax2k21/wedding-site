'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Trash2, Download, LogOut, Users, CheckCircle, HelpCircle, XCircle } from 'lucide-react';
import wedding from '@/wedding.config';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    attending: 0,
    declined: 0,
    maybe: 0,
    totalMembers: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/guests');
      if (res.status === 200) {
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.log('Not authenticated:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Server error. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/login', { method: 'DELETE' });
      setIsAuthenticated(false);
      setGuests([]);
    } catch (err) {
      console.log('Error logging out:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/guests?search=${encodeURIComponent(searchTerm)}&status=${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setGuests(data.guests);
        applyServerStats(data.stats);
      }
    } catch (err) {
      console.log('Error fetching guests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [searchTerm, statusFilter, isAuthenticated]);

  const applyServerStats = (aggregates = []) => {
    const byStatus = Object.fromEntries(aggregates.map((row) => [row._id, row]));
    setStats({
      total: aggregates.reduce((sum, row) => sum + row.count, 0),
      attending: byStatus.yes?.count || 0,
      declined: byStatus.no?.count || 0,
      maybe: byStatus.maybe?.count || 0,
      totalMembers: aggregates.reduce((sum, row) => sum + (row.totalMembers || 0), 0),
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this RSVP?')) return;

    try {
      const res = await fetch(`/api/admin/guests?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.log('Error deleting guest:', err);
    }
  };

  const downloadCSV = async () => {
    try {
      const res = await fetch('/api/admin/guests?search=&status=all');
      const data = await res.json();
      if (!data.success) return;

      const headers = ['Guest Name', 'Status', 'Members Count', 'Wishes/Message', 'Created At'];
      const rows = data.guests.map((g) => [
        g.name,
        g.status.toUpperCase(),
        g.status === 'yes' ? g.guestCount : 0,
        g.message,
        new Date(g.createdAt).toLocaleDateString()
      ]);

      const cell = (value) => `"${String(value).replace(/"/g, '""')}"`;
      const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');

      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = wedding.admin.csvFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.log('Error exporting CSV:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-primary-bg flex justify-center items-center px-4 font-jakarta">
        <div className="max-w-md w-full border border-gold/30 bg-white/[0.02] p-8 rounded-xl shadow-xl">
          <div className="text-center mb-6">
            <span className="text-gold text-2xl font-serif">{wedding.monogram}</span>
            <h2 className="text-white text-xl font-semibold mt-2">Admin Login</h2>
            <p className="text-xs text-text-muted mt-1">Access RSVP Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gold tracking-widest block mb-1">EMAIL ADDRESS</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full bg-black/40 border border-gold/30 rounded p-2.5 text-xs text-white outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gold tracking-widest block mb-1">PASSWORD</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="w-full bg-black/40 border border-gold/30 rounded p-2.5 text-xs text-white outline-none focus:border-gold"
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded text-center">{loginError}</p>
            )}

            <button 
              type="submit" 
              className="w-full bg-gold hover:bg-white text-primary-bg font-bold py-3 rounded text-xs tracking-widest transition-all"
            >
              LOGIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg text-text-main font-jakarta p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gold/10 pb-6 mb-8">
        <div>
          <span className="text-gold text-2xl font-serif">{wedding.monogram}</span>
          <h1 className="text-white text-xl font-bold mt-1">{wedding.admin.title}</h1>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 border border-gold/30 text-gold-light hover:bg-gold hover:text-primary-bg text-xs font-bold py-2.5 px-5 rounded-lg transition-all"
          >
            <Download size={14} /> EXPORT CSV
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold py-2.5 px-5 rounded-lg transition-all"
          >
            <LogOut size={14} /> LOGOUT
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total RSVPs', value: stats.total, icon: <Users className="text-gold" /> },
          { label: 'Attending (RSVPs)', value: stats.attending, icon: <CheckCircle className="text-green-400" /> },
          { label: 'Unsure/Maybe', value: stats.maybe, icon: <HelpCircle className="text-gold-light" /> },
          { label: 'Declined', value: stats.declined, icon: <XCircle className="text-red-400" /> },
          { label: 'Total Guests (Pax)', value: stats.totalMembers, icon: <Users className="text-emerald-400" /> }
        ].map((item, idx) => (
          <div key={idx} className="border border-gold/15 bg-white/[0.02] p-4 rounded-xl shadow flex items-center gap-4">
            <div className="p-3 bg-white/[0.03] rounded-lg">{item.icon}</div>
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">{item.label}</p>
              <h3 className="text-xl font-bold text-white mt-1">{item.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full md:max-w-xs">
          <Search size={14} className="absolute left-3 top-3.5 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search guest name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-gold/20 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-gold"
          />
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <Filter size={14} className="text-gold-light" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/40 border border-gold/20 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-gold"
          >
            <option value="all">All Statuses</option>
            <option value="yes">Attending</option>
            <option value="maybe">Maybe</option>
            <option value="no">Declined</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-gold/15 bg-white/[0.01] rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="text-center py-10 text-xs text-text-muted">Loading guests data...</div>
        ) : guests.length === 0 ? (
          <div className="text-center py-10 text-xs text-text-muted">No RSVP entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-gold/10 bg-white/[0.02] text-gold-light uppercase tracking-widest text-[9px]">
                  <th className="p-4 font-semibold">Guest Name</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Members</th>
                  <th className="p-4 font-semibold">Wishes & Message</th>
                  <th className="p-4 font-semibold">Date Received</th>
                  <th className="p-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/5 text-text-muted">
                {guests.map((g) => (
                  <tr key={g._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 font-medium text-white">{g.name}</td>
                    <td className="p-4">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${g.status === 'yes' ? 'bg-green-500/10 text-green-400' : g.status === 'maybe' ? 'bg-gold/10 text-gold-light' : 'bg-red-500/10 text-red-400'}`}>
                        {g.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-white">{g.status === 'yes' ? g.guestCount : 0}</td>
                    <td className="p-4 italic max-w-sm truncate" title={g.message}>&ldquo;{g.message}&rdquo;</td>
                    <td className="p-4">{new Date(g.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDelete(g._id)}
                        className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
