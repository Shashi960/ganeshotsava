import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api, { getImageUrl } from '../services/api';
import { Search, User, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  homeName?: string;
  photo?: string;
  memberType: string;
  role?: string;
  yearJoined?: number;
  phone?: string;
  email?: string;
}

export const MembersView: React.FC = () => {
  const { t } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchMembers();
  }, [search, typeFilter]);

  const fetchMembers = () => {
    setLoading(true);
    let url = `/members?search=${search}`;
    if (typeFilter !== 'all') {
      url += `&memberType=${typeFilter}`;
    }
    api.get(url).then(res => {
      if (res.data.status === 'success') {
        setMembers(res.data.members);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  // Group members for layout
  const committee = members.filter(m => m.memberType === 'Committee Member');
  const volunteers = members.filter(m => m.memberType === 'Volunteer');
  const regularMembers = members.filter(m => m.memberType === 'Member' || m.memberType === 'Senior Member');
  const juniors = members.filter(m => m.memberType === 'Junior Member');

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-wide">
          {t('navMembers')}
        </h1>
        <p className="text-charcoal-light max-w-lg mx-auto text-sm sm:text-base">
          Meet the committee organizers, volunteers, and junior community members behind Ganeshotsava.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-warm-dark p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
          <input
            type="text"
            placeholder="Search by name, home..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-warm border border-warm-dark pl-9 pr-4 py-2 rounded-lg text-sm text-charcoal focus:border-accent outline-none"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {['all', 'Committee Member', 'Volunteer', 'Member', 'Junior Member'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                typeFilter === type
                  ? 'bg-primary text-warm border border-primary'
                  : 'bg-warm-dark hover:bg-warm-dark/80 text-charcoal border border-transparent'
              }`}
            >
              {type === 'all' ? 'All' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="py-20 text-center font-semibold text-charcoal-light">Loading community members...</div>
      ) : members.length > 0 ? (
        <div className="space-y-12">
          {/* 1. Committee Section */}
          {committee.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-primary border-b border-accent/25 pb-2 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent-dark" />
                <span>Committee Members</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {committee.map((m) => (
                  <div key={m._id} className="bg-white rounded-xl border-2 border-accent/30 p-5 shadow-sm text-center relative group overflow-hidden hover:border-accent transition">
                    <div className="h-20 w-20 mx-auto rounded-full bg-accent/15 border-2 border-accent flex items-center justify-center text-accent-dark font-extrabold text-xl mb-3 shadow-inner">
                      {m.photo ? (
                        <img src={getImageUrl(m.photo)} alt={m.firstName} className="h-full w-full object-cover rounded-full" />
                      ) : (
                        getInitials(m.firstName, m.lastName)
                      )}
                    </div>
                    <span className="inline-block text-[10px] font-bold tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded mb-1">
                      {m.role || 'Organizer'}
                    </span>
                    <h3 className="font-bold text-charcoal text-base">
                      {m.firstName} {m.lastName}
                    </h3>
                    <p className="text-xs text-charcoal-light font-medium italic mt-0.5">
                      {m.homeName || 'Najagara House'}
                    </p>

                    {/* Expose details securely if available */}
                    {(m.phone || m.email) && (
                      <div className="mt-3 pt-3 border-t border-warm-dark flex justify-center gap-4 text-charcoal-light">
                        {m.phone && <a href={`tel:${m.phone}`} className="hover:text-primary transition" title={m.phone}><Phone className="h-4 w-4" /></a>}
                        {m.email && <a href={`mailto:${m.email}`} className="hover:text-primary transition" title={m.email}><Mail className="h-4 w-4" /></a>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Volunteers Section */}
          {volunteers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-primary border-b border-accent/25 pb-2">
                Volunteers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {volunteers.map((m) => (
                  <div key={m._id} className="bg-white rounded-xl border border-warm-dark p-4 shadow-sm text-center hover:border-accent transition">
                    <div className="h-16 w-16 mx-auto rounded-full bg-secondary/15 text-secondary font-extrabold flex items-center justify-center mb-3">
                      {m.photo ? (
                        <img src={getImageUrl(m.photo)} alt={m.firstName} className="h-full w-full object-cover rounded-full" />
                      ) : (
                        getInitials(m.firstName, m.lastName)
                      )}
                    </div>
                    <h3 className="font-bold text-charcoal text-sm sm:text-base">
                      {m.firstName} {m.lastName}
                    </h3>
                    <p className="text-xs text-charcoal-light font-medium italic">
                      {m.homeName || 'Najagara House'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. General Members Section */}
          {regularMembers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-primary border-b border-accent/25 pb-2">
                General Members
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {regularMembers.map((m) => (
                  <div key={m._id} className="bg-white rounded-xl border border-warm-dark p-4 shadow-sm text-center">
                    <div className="h-16 w-16 mx-auto rounded-full bg-accent/15 text-accent-dark font-extrabold flex items-center justify-center mb-3">
                      {m.photo ? (
                        <img src={getImageUrl(m.photo)} alt={m.firstName} className="h-full w-full object-cover rounded-full" />
                      ) : (
                        getInitials(m.firstName, m.lastName)
                      )}
                    </div>
                    <h3 className="font-bold text-charcoal text-sm sm:text-base">
                      {m.firstName} {m.lastName}
                    </h3>
                    <p className="text-xs text-charcoal-light font-medium italic">
                      {m.homeName || 'Najagara House'}
                    </p>
                    {m.yearJoined && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-charcoal-light/70 bg-warm-dark px-2 py-0.5 rounded">
                        <Calendar className="h-3 w-3" /> Joined: {m.yearJoined}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Junior Members Section */}
          {juniors.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-primary border-b border-accent/25 pb-2">
                Junior Members
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {juniors.map((m) => (
                  <div key={m._id} className="bg-white rounded-xl border border-warm-dark p-4 shadow-sm text-center">
                    <div className="h-16 w-16 mx-auto rounded-full bg-sky-50 text-sky-600 font-extrabold flex items-center justify-center mb-3 border border-sky-200">
                      {m.photo ? (
                        <img src={getImageUrl(m.photo)} alt={m.firstName} className="h-full w-full object-cover rounded-full" />
                      ) : (
                        getInitials(m.firstName, m.lastName)
                      )}
                    </div>
                    <h3 className="font-bold text-charcoal text-sm sm:text-base">
                      {m.firstName} {m.lastName}
                    </h3>
                    <p className="text-xs text-charcoal-light font-medium italic">
                      {m.homeName || 'Najagara House'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-warm-dark p-12 text-center text-charcoal-light font-semibold">
          No members found matching search parameters.
        </div>
      )}
    </div>
  );
};
