import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api, { getImageUrl } from '../services/api';
import { Search, ShieldCheck, Mail, Phone, Calendar, Award, Sparkles, HeartHandshake, Users } from 'lucide-react';

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
  const { language, t } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchMembers();
  }, [search, typeFilter]);

  const fetchMembers = () => {
    setLoading(true);
    let url = `/members?limit=200&search=${encodeURIComponent(search)}`;
    if (typeFilter !== 'all') {
      url += `&memberType=${encodeURIComponent(typeFilter)}`;
    }
    api.get(url).then(res => {
      if (res.data.status === 'success') {
        setMembers(res.data.members || []);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const getInitials = (first?: string, last?: string) => {
    return `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();
  };

  // Group members for layout
  const committee = members.filter(m => m.memberType === 'Committee Member');
  const seniorMembers = members.filter(m => m.memberType === 'Senior Member');
  const regularMembers = members.filter(
    m => m.memberType === 'Member' || !['Committee Member', 'Senior Member', 'Junior Member', 'Volunteer'].includes(m.memberType)
  );
  const juniors = members.filter(m => m.memberType === 'Junior Member');
  const volunteers = members.filter(m => m.memberType === 'Volunteer');

  const filterTabs = [
    { id: 'all', label: language === 'kn' ? 'ಎಲ್ಲಾ (All)' : 'All' },
    { id: 'Committee Member', label: language === 'kn' ? 'ಸಮಿತಿ ಸದಸ್ಯರು (Committee)' : 'Committee Member' },
    { id: 'Senior Member', label: language === 'kn' ? 'ಹಿರಿಯ ಸದಸ್ಯರು (Senior Member)' : 'Senior Member' },
    { id: 'Member', label: language === 'kn' ? 'ಸಾಮಾನ್ಯ ಸದಸ್ಯರು (Member)' : 'Member' },
    { id: 'Junior Member', label: language === 'kn' ? 'ಕಿರಿಯ ಸದಸ್ಯರು (Junior Member)' : 'Junior Member' },
    { id: 'Volunteer', label: language === 'kn' ? 'ಸ್ವಯಂಸೇವಕರು (Volunteer)' : 'Volunteer' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-wide">
          {t('navMembers')}
        </h1>
        <p className="text-charcoal-light max-w-xl mx-auto text-sm sm:text-base">
          {language === 'kn'
            ? 'ಗಣೇಶೋತ್ಸವ ಸಮಿತಿಯ ಸಂಘಟಕರು, ಹಿರಿಯ ಸದಸ್ಯರು, ಸಾಮಾನ್ಯ ಸದಸ್ಯರು, ಕಿರಿಯರು ಹಾಗೂ ಸ್ವಯಂಸೇವಕರ ಪರಿಚಯ.'
            : 'Meet the committee organizers, senior members, general members, junior members, and volunteers behind Ganeshotsava.'}
        </p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-warm-dark p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
          <input
            type="text"
            placeholder={language === 'kn' ? 'ಹೆಸರು, ಮನೆಯ ಹೆಸರು ಹುಡುಕಿ...' : 'Search by name, home...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-warm border border-warm-dark pl-9 pr-4 py-2 rounded-lg text-sm text-charcoal focus:border-accent outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {filterTabs.map((type) => (
            <button
              key={type.id}
              onClick={() => setTypeFilter(type.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                typeFilter === type.id
                  ? 'bg-primary text-warm border border-primary shadow-sm'
                  : 'bg-warm-dark hover:bg-warm-dark/80 text-charcoal border border-transparent'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="py-20 text-center font-semibold text-charcoal-light">
          {language === 'kn' ? 'ಸದಸ್ಯರ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading community members...'}
        </div>
      ) : members.length > 0 ? (
        <div className="space-y-12">
          {/* 1. Committee Section */}
          {committee.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-primary border-b border-accent/25 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent-dark" />
                  <span>{language === 'kn' ? 'ಸಮಿತಿ ಸದಸ್ಯರು' : 'Committee Members'}</span>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                  {committee.length} {language === 'kn' ? 'ಸದಸ್ಯರು' : 'Members'}
                </span>
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
                      {m.role || (language === 'kn' ? 'ಸಂಘಟಕರು' : 'Organizer')}
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

          {/* 2. Senior Members Section (shown separately with its own row) */}
          {seniorMembers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-primary border-b border-accent/25 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-600" />
                  <span>{language === 'kn' ? 'ಹಿರಿಯ ಸದಸ್ಯರು' : 'Senior Members'}</span>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-full">
                  {seniorMembers.length} {language === 'kn' ? 'ಸದಸ್ಯರು' : 'Members'}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {seniorMembers.map((m) => (
                  <div key={m._id} className="bg-white rounded-xl border-2 border-amber-200/90 p-5 shadow-sm text-center relative group hover:border-amber-400 hover:shadow-md transition">
                    <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-900 font-extrabold text-xl mb-3 shadow-inner">
                      {m.photo ? (
                        <img src={getImageUrl(m.photo)} alt={m.firstName} className="h-full w-full object-cover rounded-full" />
                      ) : (
                        getInitials(m.firstName, m.lastName)
                      )}
                    </div>
                    <span className="inline-block text-[10px] font-bold tracking-widest text-amber-800 bg-amber-100 border border-amber-300/80 px-2.5 py-0.5 rounded-full mb-1">
                      {m.role || (language === 'kn' ? 'ಹಿರಿಯ ಸದಸ್ಯರು' : 'Senior Member')}
                    </span>
                    <h3 className="font-bold text-charcoal text-base">
                      {m.firstName} {m.lastName}
                    </h3>
                    <p className="text-xs text-charcoal-light font-medium italic mt-0.5">
                      {m.homeName || 'Najagara House'}
                    </p>
                    {m.yearJoined && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-charcoal-light/70 bg-warm-dark px-2 py-0.5 rounded">
                        <Calendar className="h-3 w-3" /> {language === 'kn' ? 'ಸೇರ್ಪಡೆ' : 'Joined'}: {m.yearJoined}
                      </span>
                    )}

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

          {/* 3. General Members Section (Normal Members) */}
          {regularMembers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-primary border-b border-accent/25 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent-dark" />
                  <span>{language === 'kn' ? 'ಸಾಮಾನ್ಯ ಸದಸ್ಯರು' : 'General Members'}</span>
                </div>
                <span className="text-xs font-bold text-charcoal-light bg-warm-dark border border-warm-dark px-2.5 py-0.5 rounded-full">
                  {regularMembers.length} {language === 'kn' ? 'ಸದಸ್ಯರು' : 'Members'}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {regularMembers.map((m) => (
                  <div key={m._id} className="bg-white rounded-xl border border-warm-dark p-4 shadow-sm text-center hover:border-accent transition">
                    <div className="h-16 w-16 mx-auto rounded-full bg-accent/15 text-accent-dark font-extrabold flex items-center justify-center mb-3">
                      {m.photo ? (
                        <img src={getImageUrl(m.photo)} alt={m.firstName} className="h-full w-full object-cover rounded-full" />
                      ) : (
                        getInitials(m.firstName, m.lastName)
                      )}
                    </div>
                    {m.role && (
                      <span className="inline-block text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded mb-1">
                        {m.role}
                      </span>
                    )}
                    <h3 className="font-bold text-charcoal text-sm sm:text-base">
                      {m.firstName} {m.lastName}
                    </h3>
                    <p className="text-xs text-charcoal-light font-medium italic">
                      {m.homeName || 'Najagara House'}
                    </p>
                    {m.yearJoined && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-charcoal-light/70 bg-warm-dark px-2 py-0.5 rounded">
                        <Calendar className="h-3 w-3" /> {language === 'kn' ? 'ಸೇರ್ಪಡೆ' : 'Joined'}: {m.yearJoined}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Junior Members Section (below normal members) */}
          {juniors.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-primary border-b border-accent/25 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-sky-600" />
                  <span>{language === 'kn' ? 'ಕಿರಿಯ ಸದಸ್ಯರು' : 'Junior Members'}</span>
                </div>
                <span className="text-xs font-bold text-sky-800 bg-sky-100 border border-sky-300 px-2.5 py-0.5 rounded-full">
                  {juniors.length} {language === 'kn' ? 'ಸದಸ್ಯರು' : 'Members'}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {juniors.map((m) => (
                  <div key={m._id} className="bg-white rounded-xl border border-warm-dark p-4 shadow-sm text-center hover:border-sky-300 transition">
                    <div className="h-16 w-16 mx-auto rounded-full bg-sky-50 text-sky-600 font-extrabold flex items-center justify-center mb-3 border border-sky-200">
                      {m.photo ? (
                        <img src={getImageUrl(m.photo)} alt={m.firstName} className="h-full w-full object-cover rounded-full" />
                      ) : (
                        getInitials(m.firstName, m.lastName)
                      )}
                    </div>
                    <span className="inline-block text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded mb-1">
                      {language === 'kn' ? 'ಕಿರಿಯ ಸದಸ್ಯರು' : 'Junior Member'}
                    </span>
                    <h3 className="font-bold text-charcoal text-sm sm:text-base">
                      {m.firstName} {m.lastName}
                    </h3>
                    <p className="text-xs text-charcoal-light font-medium italic">
                      {m.homeName || 'Najagara House'}
                    </p>
                    {m.yearJoined && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-charcoal-light/70 bg-warm-dark px-2 py-0.5 rounded">
                        <Calendar className="h-3 w-3" /> {language === 'kn' ? 'ಸೇರ್ಪಡೆ' : 'Joined'}: {m.yearJoined}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Volunteers Section */}
          {volunteers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-primary border-b border-accent/25 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="h-5 w-5 text-secondary" />
                  <span>{language === 'kn' ? 'ಸ್ವಯಂಸೇವಕರು' : 'Volunteers'}</span>
                </div>
                <span className="text-xs font-bold text-secondary-dark bg-secondary/15 border border-secondary/30 px-2.5 py-0.5 rounded-full">
                  {volunteers.length} {language === 'kn' ? 'ಸ್ವಯಂಸೇವಕರು' : 'Volunteers'}
                </span>
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
                    <span className="inline-block text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded mb-1">
                      {m.role || (language === 'kn' ? 'ಸ್ವಯಂಸೇವಕರು' : 'Volunteer')}
                    </span>
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
          {language === 'kn' ? 'ಹುಡುಕಾಟಕ್ಕೆ ತಕ್ಕ ಸದಸ್ಯರು ಕಂಡುಬಂದಿಲ್ಲ.' : 'No members found matching search parameters.'}
        </div>
      )}
    </div>
  );
};
