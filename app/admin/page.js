'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Filter, Trash2, Download, LogOut, Users, CheckCircle, HelpCircle, XCircle,
  Image as ImageIcon, Plus, Pencil, ChevronUp, ChevronDown, Upload, X, Loader2,
  ExternalLink,
} from 'lucide-react';
import wedding from '@/wedding.config';

const { couple } = wedding;
const people = couple.order === 'bride-first' ? [couple.bride, couple.groom] : [couple.groom, couple.bride];
const coupleLabel = `${people[0].shortName} & ${people[1].shortName}`;

const TABS = [
  { id: 'rsvps', label: 'RSVPs', icon: Users },
  { id: 'gallery', label: 'Gallery', icon: ImageIcon },
];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState('rsvps');

  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({ total: 0, attending: 0, declined: 0, maybe: 0, totalMembers: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const [collections, setCollections] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [newCollection, setNewCollection] = useState('');
  const [renaming, setRenaming] = useState(null);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState('');
  const [cloudinaryReady, setCloudinaryReady] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/guests');
      if (res.status === 200) setIsAuthenticated(true);
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
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) setIsAuthenticated(true);
      else setLoginError(data.error || 'Invalid credentials');
    } catch {
      setLoginError('Server error. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/login', { method: 'DELETE' });
      setIsAuthenticated(false);
      setGuests([]);
      setCollections([]);
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
    if (isAuthenticated) fetchData();
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
      const res = await fetch(`/api/admin/guests?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchData();
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
        new Date(g.createdAt).toLocaleDateString(),
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

  const fetchGallery = async () => {
    setGalleryLoading(true);
    try {
      const res = await fetch('/api/admin/gallery');
      const data = await res.json();
      if (data.success) {
        setCollections(data.collections);
        setCloudinaryReady(data.cloudinaryReady !== false);
        setActiveId((current) => {
          if (current && data.collections.some((c) => c._id === current)) return current;
          return data.collections[0]?._id || null;
        });
      }
    } catch (err) {
      console.log('Error fetching gallery:', err);
    } finally {
      setGalleryLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && tab === 'gallery') fetchGallery();
  }, [isAuthenticated, tab]);

  const createCollection = async (e) => {
    e.preventDefault();
    if (!newCollection.trim()) return;
    setGalleryError('');
    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollection }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCollection('');
        await fetchGallery();
        setActiveId(data.collection._id);
      } else {
        setGalleryError(data.error || 'Could not create collection');
      }
    } catch {
      setGalleryError('Server error while creating the collection');
    }
  };

  const moveCollection = async (index, direction) => {
    const next = [...collections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setCollections(next);
    try {
      await fetch('/api/admin/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((c) => c._id) }),
      });
    } catch {
      fetchGallery();
    }
  };

  const saveRename = async (id, name) => {
    if (!name.trim()) {
      setRenaming(null);
      return;
    }
    try {
      await fetch('/api/admin/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      });
      setRenaming(null);
      fetchGallery();
    } catch {
      setGalleryError('Could not rename the collection');
    }
  };

  const deleteCollection = async (collection) => {
    if (!confirm(`Delete “${collection.name}” and its ${collection.photos.length} photo(s)?`)) return;
    try {
      await fetch(`/api/admin/gallery?id=${collection._id}`, { method: 'DELETE' });
      await fetchGallery();
    } catch {
      setGalleryError('Could not delete the collection');
    }
  };

  const deletePhoto = async (photo) => {
    if (!confirm('Delete this photo?')) return;
    try {
      await fetch(`/api/admin/gallery/photo?id=${photo._id}`, { method: 'DELETE' });
      await fetchGallery();
    } catch {
      setGalleryError('Could not delete the photo');
    }
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((file) => file.type.startsWith('image/'));
    if (!files.length || !activeId) return;
    setGalleryError('');
    setUploading(true);
    setProgress({ done: 0, total: files.length });

    try {
      for (const file of files) {
        const signRes = await fetch('/api/admin/gallery/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collectionId: activeId }),
        });
        const sign = await signRes.json();
        if (!sign.success) throw new Error(sign.error || 'Could not sign the upload');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', sign.apiKey);
        formData.append('timestamp', String(sign.timestamp));
        formData.append('signature', sign.signature);
        formData.append('folder', sign.folder);
        formData.append('transformation', sign.transformation);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        const uploaded = await uploadRes.json();
        if (!uploaded.secure_url) throw new Error(uploaded.error?.message || 'Cloudinary upload failed');

        const url = uploaded.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_1200,c_limit/');
        const saveRes = await fetch('/api/admin/gallery/photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collectionId: activeId,
            publicId: uploaded.public_id,
            url,
            caption: file.name.replace(/\.[^.]+$/, ''),
          }),
        });
        const saved = await saveRes.json();
        if (!saved.success) throw new Error(saved.error || 'Could not save the photo');

        setProgress((current) => ({ ...current, done: current.done + 1 }));
      }
      await fetchGallery();
    } catch (err) {
      setGalleryError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const activeCollection = collections.find((collection) => collection._id === activeId) || null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-primary-bg flex justify-center items-center px-4 font-jakarta relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.08),transparent_55%)] pointer-events-none" />
        <div className="relative max-w-md w-full border border-gold/25 bg-white/[0.03] backdrop-blur-xl p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
            <span className="text-gold text-3xl font-serif">{wedding.monogram}</span>
            <h2 className="text-white text-xl font-semibold mt-3">Admin Login</h2>
            <p className="text-[10px] tracking-[0.25em] text-text-muted uppercase mt-2">{coupleLabel}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gold tracking-widest block mb-1">EMAIL ADDRESS</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/40 border border-gold/25 rounded-lg p-3 text-xs text-white outline-none focus:border-gold transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gold tracking-widest block mb-1">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/40 border border-gold/25 rounded-lg p-3 text-xs text-white outline-none focus:border-gold transition-colors"
              />
            </div>

            {loginError && <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded text-center">{loginError}</p>}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#ffe596] via-[#d4af37] to-[#aa7c11] text-primary-bg font-extrabold py-3 rounded-lg text-xs tracking-[0.2em] uppercase hover:brightness-110 transition-all"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg text-text-main font-jakarta">
      <header className="border-b border-gold/10 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.09),transparent_60%)]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-gold font-serif text-3xl leading-none">{wedding.monogram}</span>
            <div>
              <h1 className="text-white text-lg font-bold leading-tight">{wedding.admin.title}</h1>
              <p className="text-[10px] tracking-[0.25em] text-text-muted uppercase mt-1">{coupleLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 border border-gold/25 text-gold-light hover:bg-gold hover:text-primary-bg text-[11px] font-bold py-2.5 px-4 rounded-lg transition-all"
            >
              <ExternalLink size={13} /> VIEW SITE
            </a>
            {tab === 'rsvps' && (
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 border border-gold/25 text-gold-light hover:bg-gold hover:text-primary-bg text-[11px] font-bold py-2.5 px-4 rounded-lg transition-all"
              >
                <Download size={13} /> CSV
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 border border-red-500/25 text-red-400 hover:bg-red-500 hover:text-white text-[11px] font-bold py-2.5 px-4 rounded-lg transition-all"
            >
              <LogOut size={13} /> LOGOUT
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors ${
                tab === id ? 'text-gold-light' : 'text-text-muted hover:text-white'
              }`}
            >
              <Icon size={14} /> {label}
              {id === 'gallery' && collections.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gold/15 text-gold-light">{collections.length}</span>
              )}
              <span
                className={`absolute inset-x-2 -bottom-[1px] h-[2px] rounded-full bg-gradient-to-r from-transparent via-gold to-transparent transition-opacity ${
                  tab === id ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {tab === 'rsvps' ? (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              {[
                { label: 'Total RSVPs', value: stats.total, icon: <Users size={16} className="text-gold" /> },
                { label: 'Attending', value: stats.attending, icon: <CheckCircle size={16} className="text-green-400" /> },
                { label: 'Unsure', value: stats.maybe, icon: <HelpCircle size={16} className="text-gold-light" /> },
                { label: 'Declined', value: stats.declined, icon: <XCircle size={16} className="text-red-400" /> },
                { label: 'Total Guests', value: stats.totalMembers, icon: <Users size={16} className="text-emerald-400" /> },
              ].map((item) => (
                <div key={item.label} className="border border-gold/15 bg-white/[0.02] p-4 rounded-xl flex items-center gap-3 hover:border-gold/30 transition-colors">
                  <div className="p-2.5 bg-white/[0.03] rounded-lg">{item.icon}</div>
                  <div>
                    <p className="text-[9px] text-text-muted uppercase tracking-wider">{item.label}</p>
                    <h3 className="text-xl font-bold text-white mt-0.5">{item.value}</h3>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-5">
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
                        <th className="p-4 font-semibold">Wishes &amp; Message</th>
                        <th className="p-4 font-semibold">Date</th>
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
                              aria-label={`Delete RSVP from ${g.name}`}
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
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
            <aside className="border border-gold/15 bg-white/[0.02] rounded-2xl p-4 h-fit">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] tracking-[0.25em] text-gold font-bold uppercase">Collections</h2>
                <span className="text-[10px] text-text-muted">{collections.length}</span>
              </div>

              <div className="space-y-2">
                {collections.map((collection, index) => (
                  <div
                    key={collection._id}
                    className={`group rounded-xl border px-3 py-2.5 transition-all ${
                      activeId === collection._id
                        ? 'border-gold/70 bg-gold/10'
                        : 'border-gold/10 hover:border-gold/35 bg-white/[0.01]'
                    }`}
                  >
                    {renaming?.id === collection._id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          saveRename(collection._id, renaming.value);
                        }}
                      >
                        <input
                          autoFocus
                          value={renaming.value}
                          onChange={(e) => setRenaming({ ...renaming, value: e.target.value })}
                          onBlur={() => saveRename(collection._id, renaming.value)}
                          onKeyDown={(e) => e.key === 'Escape' && setRenaming(null)}
                          maxLength={60}
                          className="w-full bg-black/50 border border-gold/40 rounded px-2 py-1 text-xs text-white outline-none focus:border-gold"
                        />
                      </form>
                    ) : (
                      <button onClick={() => setActiveId(collection._id)} className="w-full text-left">
                        <span className="block text-xs font-semibold text-white truncate">{collection.name}</span>
                        <span className="block text-[9px] text-text-muted mt-0.5">
                          {collection.photos.length} photo{collection.photos.length === 1 ? '' : 's'}
                        </span>
                      </button>
                    )}

                    <div className="flex items-center gap-1 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveCollection(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${collection.name} up`}
                        className="p-1 rounded hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        onClick={() => moveCollection(index, 1)}
                        disabled={index === collections.length - 1}
                        aria-label={`Move ${collection.name} down`}
                        className="p-1 rounded hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent"
                      >
                        <ChevronDown size={13} />
                      </button>
                      <button
                        onClick={() => setRenaming({ id: collection._id, value: collection.name })}
                        aria-label={`Rename ${collection.name}`}
                        className="p-1 rounded hover:bg-white/10 ml-auto"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => deleteCollection(collection)}
                        aria-label={`Delete ${collection.name}`}
                        className="p-1 rounded hover:bg-red-500/20 text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={createCollection} className="mt-4 flex gap-2">
                <input
                  value={newCollection}
                  onChange={(e) => setNewCollection(e.target.value)}
                  placeholder="New collection"
                  maxLength={60}
                  className="flex-1 min-w-0 bg-black/40 border border-gold/20 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold placeholder:text-text-muted/50"
                />
                <button
                  type="submit"
                  aria-label="Create collection"
                  className="p-2 rounded-lg bg-gold text-primary-bg hover:bg-white transition-colors"
                >
                  <Plus size={14} />
                </button>
              </form>

              <p className="text-[9px] leading-relaxed text-text-muted/60 mt-4">
                Order here is the order guests see on the website.
              </p>
            </aside>

            <section
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={`border rounded-2xl p-5 min-h-[420px] transition-colors ${
                dragging ? 'border-gold bg-gold/[0.06]' : 'border-gold/15 bg-white/[0.02]'
              }`}
            >
              {galleryLoading ? (
                <div className="flex items-center justify-center h-full text-xs text-text-muted py-20">
                  <Loader2 size={16} className="animate-spin mr-2" /> Loading gallery...
                </div>
              ) : activeCollection ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div>
                      <h2 className="font-serif text-2xl text-white">{activeCollection.name}</h2>
                      <p className="text-[10px] text-text-muted mt-1">{activeCollection.photos.length} photo(s)</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => handleFiles(e.target.files)}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 bg-gold text-primary-bg font-bold text-[11px] tracking-wider uppercase py-2.5 px-4 rounded-lg hover:bg-white transition-colors disabled:opacity-60"
                      >
                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {uploading ? `${progress.done}/${progress.total}` : 'Upload photos'}
                      </button>
                    </div>
                  </div>

                  {!cloudinaryReady && (
                    <div className="mb-4 border border-gold/25 bg-gold/[0.06] rounded-lg p-3 text-[11px] text-gold-light">
                      Add <code className="text-white">CLOUDINARY_CLOUD_NAME</code>, <code className="text-white">CLOUDINARY_API_KEY</code> and{' '}
                      <code className="text-white">CLOUDINARY_API_SECRET</code> to enable uploads.
                    </div>
                  )}

                  {galleryError && (
                    <div className="mb-4 border border-red-500/30 bg-red-500/10 rounded-lg p-3 text-[11px] text-red-300 flex items-start justify-between gap-3">
                      <span>{galleryError}</span>
                      <button onClick={() => setGalleryError('')} aria-label="Dismiss error"><X size={13} /></button>
                    </div>
                  )}

                  {activeCollection.photos.length === 0 ? (
                    <div className="border border-dashed border-gold/20 rounded-xl py-16 text-center">
                      <ImageIcon size={26} className="mx-auto text-gold/50 mb-3" />
                      <p className="text-xs text-text-muted">No photos yet.</p>
                      <p className="text-[10px] text-text-muted/60 mt-1">Drop images here or use “Upload photos”.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {activeCollection.photos.map((photo) => (
                        <div
                          key={photo._id}
                          className="group relative aspect-square overflow-hidden rounded-xl border border-gold/10 hover:border-gold/40 transition-colors bg-black/30"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={photo.caption || activeCollection.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          {photo.caption && (
                            <span className="absolute inset-x-0 bottom-0 p-2 text-[9px] uppercase tracking-wider text-white/85 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                              {photo.caption}
                            </span>
                          )}
                          <button
                            onClick={() => deletePhoto(photo)}
                            aria-label="Delete photo"
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-red-300 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploading && (
                    <div className="mt-4">
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold transition-all"
                          style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20">
                  <ImageIcon size={26} className="mx-auto text-gold/50 mb-3" />
                  <p className="text-xs text-text-muted">Create or select a collection to add photos.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
