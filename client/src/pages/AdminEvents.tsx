import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Plus, Edit2, Trash2, Copy, Search, X, Check, Calendar, Clock, MapPin } from 'lucide-react';

interface EventItem {
  _id: string;
  title: string;
  titleKannada: string;
  description?: string;
  descriptionKannada?: string;
  date: string;
  startTime: string;
  location: string;
  category: string;
  status: string;
  featured: boolean;
  team?: { _id: string; name: string };
}

interface Team {
  _id: string;
  name: string;
  nameKannada: string;
}

export const AdminEvents: React.FC = () => {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [titleKannada, setTitleKannada] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionKannada, setDescriptionKannada] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Puja');
  const [status, setStatus] = useState('Upcoming');
  const [featured, setFeatured] = useState(false);
  const [team, setTeam] = useState('');

  useEffect(() => {
    fetchEvents();
    api.get('/teams').then(res => {
      if (res.data.status === 'success') setTeams(res.data.teams);
    });
  }, []);

  const fetchEvents = () => {
    setLoading(true);
    api.get('/events?year=2025').then(res => {
      if (res.data.status === 'success') {
        setEvents(res.data.events);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setTitle('');
    setTitleKannada('');
    setDescription('');
    setDescriptionKannada('');
    setDate('2025-08-27');
    setStartTime('12:00 PM');
    setLocation('Sri Ganapati Sannidhi, Najagara');
    setCategory('Puja');
    setStatus('Upcoming');
    setFeatured(false);
    setTeam('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (evt: EventItem) => {
    setEditingId(evt._id);
    setTitle(evt.title);
    setTitleKannada(evt.titleKannada);
    setDescription(evt.description || '');
    setDescriptionKannada(evt.descriptionKannada || '');
    setDate(evt.date.split('T')[0]);
    setStartTime(evt.startTime);
    setLocation(evt.location);
    setCategory(evt.category);
    setStatus(evt.status);
    setFeatured(evt.featured);
    setTeam(evt.team?._id || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      titleKannada,
      description,
      descriptionKannada,
      date,
      startTime,
      location,
      category,
      status,
      featured,
      team: team || undefined,
      year: '2025'
    };

    try {
      if (editingId) {
        await api.put(`/events/${editingId}`, payload);
        showToast('Event updated successfully!');
      } else {
        await api.post('/events', payload);
        showToast('Event created successfully!');
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (error) {
      console.error(error);
      showToast('Failed to save event.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/events/${id}`);
      showToast('Event deleted successfully.');
      fetchEvents();
    } catch (error) {
      console.error(error);
      showToast('Failed to delete event.', 'error');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.post(`/events/${id}/duplicate`, { targetYear: '2025' });
      showToast('Event duplicated successfully!');
      fetchEvents();
    } catch (error) {
      console.error(error);
      showToast('Failed to duplicate event.', 'error');
    }
  };

  const filteredEvents = events.filter(evt =>
    evt.title.toLowerCase().includes(search.toLowerCase()) ||
    evt.titleKannada.includes(search)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-dark pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary">Manage Ganeshotsava Schedule</h1>
          <p className="text-xs text-charcoal-light">Add, edit, duplicate, and delete program events.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 bg-primary text-warm font-bold px-4 py-2 rounded-lg hover:bg-primary-light transition shadow self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Search Header */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-warm-dark pl-9 pr-4 py-2 rounded-lg text-sm text-charcoal outline-none focus:border-accent"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-charcoal-light">Loading events...</div>
      ) : filteredEvents.length > 0 ? (
        <div className="bg-white rounded-xl border border-warm-dark overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-dark/40 border-b border-warm-dark text-xs font-bold text-charcoal-light uppercase">
                  <th className="p-4">Title</th>
                  <th className="p-4">Date / Time</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Featured</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-dark text-sm">
                {filteredEvents.map(evt => (
                  <tr key={evt._id} className="hover:bg-warm-dark/5">
                    <td className="p-4">
                      <div className="font-bold text-charcoal">{evt.title}</div>
                      <div className="text-xs text-charcoal-light font-kannada">{evt.titleKannada}</div>
                    </td>
                    <td className="p-4 text-charcoal-light font-semibold">
                      <div>{evt.startTime}</div>
                      <div className="text-xs">{evt.date.split('T')[0]}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold bg-accent/20 text-primary px-2.5 py-0.5 rounded-full">
                        {evt.category}
                      </span>
                    </td>
                    <td className="p-4">
                      {evt.featured ? (
                        <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">★ Yes</span>
                      ) : (
                        <span className="text-xs text-charcoal-light">No</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenEditModal(evt)} className="p-1.5 border border-warm-dark hover:bg-warm rounded inline-flex" title="Edit"><Edit2 className="h-4 w-4 text-charcoal" /></button>
                      <button onClick={() => handleDuplicate(evt._id)} className="p-1.5 border border-warm-dark hover:bg-warm rounded inline-flex" title="Duplicate"><Copy className="h-4 w-4 text-secondary" /></button>
                      <button onClick={() => handleDelete(evt._id)} className="p-1.5 border border-warm-dark hover:bg-warm rounded inline-flex" title="Delete"><Trash2 className="h-4 w-4 text-rose-600" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-warm-dark p-8 rounded-xl text-center text-charcoal-light">
          No events found.
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-warm-dark max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-warm-dark pb-2">
              <h2 className="text-lg font-bold text-primary">{editingId ? 'Edit Program Event' : 'Add Program Event'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5 text-charcoal-light" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm text-charcoal">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs">Title (English)</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none focus:border-accent" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-xs">Title (Kannada)</label>
                  <input type="text" required value={titleKannada} onChange={(e) => setTitleKannada(e.target.value)} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none focus:border-accent" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs">Description (English)</label>
                  <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none focus:border-accent resize-none" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-xs">Description (Kannada)</label>
                  <textarea rows={2} value={descriptionKannada} onChange={(e) => setDescriptionKannada(e.target.value)} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none focus:border-accent resize-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs">Date</label>
                  <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-xs">Start Time</label>
                  <input type="text" required placeholder="e.g. 12:00 PM" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-xs">Location</label>
                  <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none">
                    {['Puja', 'Religious', 'Cultural', 'Community', 'Food', 'Volunteer', 'Procession', 'Immersion', 'Other'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-xs">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none">
                    {['Upcoming', 'Starting Soon', 'Happening Now', 'Completed'].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-xs">Committee Team</label>
                  <select value={team} onChange={(e) => setTeam(e.target.value)} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none">
                    <option value="">No Team Assigned</option>
                    {teams.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="featured" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 text-primary" />
                <label htmlFor="featured" className="font-bold text-xs cursor-pointer">Feature on Homepage</label>
              </div>

              <div className="flex justify-end gap-2 border-t border-warm-dark pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-warm-dark rounded-lg text-charcoal hover:bg-warm transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-warm font-bold rounded-lg hover:bg-primary-light transition">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
