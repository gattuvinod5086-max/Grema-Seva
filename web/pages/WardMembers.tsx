import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Phone,
  MapPin,
  User,
  Crown,
  Sparkles,
  Loader2,
  Search,
  X,
  RotateCcw,
  Mail,
  Building2,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApi } from '@web/hooks/useApi';
import { UserProfileCapsule } from '@web/components/ui/UserRoleBadge';
import type { User as UserType } from '@shared/types';
import {
  telanganaData,
  getMandalNames,
  getVillageNames,
  sanitizeGeoSelection,
  type District,
} from '@shared/data/telangana';

interface OfficialCard {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  wardNumber: string | null;
}

interface DirectoryResponse {
  village: { district: string; mandal: string; village: string } | null;
  sarpanch: OfficialCard | null;
  wardMembers: OfficialCard[];
}

/**
 * Village directory: the real sarpanch and ward members registered in the
 * app for a village. Defaults to the user's registered village, with the
 * ability to explore and search any Gram Panchayat across Telangana.
 */
export function WardMembers() {
  const navigate = useNavigate();
  const { data: meData, isLoading: meLoading } = useApi<{ user: UserType }>('/api/users/me');
  const me = meData?.user ?? null;

  const [picked, setPicked] = useState<{ district: string; mandal: string; village: string } | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown filter state for picking villages
  const [district, setDistrict] = useState('');
  const [mandal, setMandal] = useState('');
  const [village, setVillage] = useState('');

  // When picked is set, load that specific village; otherwise load user's registered village
  const directoryUrl = useMemo(() => {
    if (picked) {
      const p = new URLSearchParams(picked as Record<string, string>);
      return `/api/users/directory?${p.toString()}`;
    }
    if (me?.district && me?.mandal && me?.village) {
      return '/api/users/directory';
    }
    return null;
  }, [me?.district, me?.mandal, me?.village, picked]);

  const { data: directory, isLoading: dirLoading } = useApi<DirectoryResponse>(
    directoryUrl ?? '/api/users/directory',
    {
      enabled: directoryUrl !== null,
    }
  );

  const lookupFor = (d: string, m: string, v: string) => {
    setPicked({ district: d, mandal: m, village: v });
    setShowSelector(false);
    setSearchQuery('');
  };

  const resetToMyVillage = () => {
    setPicked(null);
    setShowSelector(false);
    setSearchQuery('');
    setDistrict('');
    setMandal('');
    setVillage('');
  };

  // Filter ward members by search query (name, ward number, phone, email)
  const filteredWardMembers = useMemo(() => {
    if (!directory?.wardMembers) return [];
    if (!searchQuery.trim()) return directory.wardMembers;
    const q = searchQuery.toLowerCase().trim();
    return directory.wardMembers.filter((m) => {
      const nameMatch = m.name.toLowerCase().includes(q);
      const wardMatch = m.wardNumber ? m.wardNumber.toLowerCase() === q || `ward ${m.wardNumber}`.toLowerCase().includes(q) : false;
      const phoneMatch = m.phone ? m.phone.includes(q) : false;
      const emailMatch = m.email ? m.email.toLowerCase().includes(q) : false;
      return nameMatch || wardMatch || phoneMatch || emailMatch;
    });
  }, [directory?.wardMembers, searchQuery]);

  if (meLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">📍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in required</h2>
          <p className="text-gray-600 mb-6">Sign in to view the village directory.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-pink-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const needsPick = !directory?.village;
  const isViewingDifferentVillage =
    Boolean(picked) &&
    (picked?.village !== me?.village || picked?.mandal !== me?.mandal || picked?.district !== me?.district);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50 pb-16">
      {/* Telangana Header Banner */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-5 h-5" />
            <p className="text-sm md:text-base font-bold">
              తెలంగాణ రాష్ట్రం | Telangana State | Gram Panchayat Representatives
            </p>
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-md border-b-4 border-pink-300">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-100 to-blue-100 rounded-xl hover:from-pink-200 hover:to-blue-200 transition-all shadow-sm font-semibold text-gray-700 text-sm"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
              <span>Back to Dashboard</span>
            </button>
            <UserProfileCapsule user={me} />
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-8 h-8 text-pink-600" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                  Sarpanch & Ward Members Directory
                </h1>
              </div>
              {directory?.village && (
                <p className="text-gray-600 mt-2 flex items-center gap-2 text-sm md:text-base">
                  <MapPin className="w-4 h-4 text-pink-600 flex-shrink-0" />
                  <span className="font-semibold text-gray-900">
                    {directory.village.village} Gram Panchayat
                  </span>
                  <span className="text-gray-400">·</span>
                  <span>{directory.village.mandal} Mandal</span>
                  <span className="text-gray-400">·</span>
                  <span>{directory.village.district} District</span>
                </p>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              {isViewingDifferentVillage && (
                <button
                  onClick={resetToMyVillage}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>My Village</span>
                </button>
              )}
              <button
                onClick={() => setShowSelector(!showSelector)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs md:text-sm transition shadow-sm ${
                  showSelector
                    ? 'bg-gray-800 text-white'
                    : 'bg-gradient-to-r from-pink-600 to-blue-600 text-white hover:opacity-95'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>{showSelector ? 'Close Village Selector' : 'Change / Select Village'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Village Selector Dropdowns */}
        {(showSelector || needsPick) && (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-pink-200 p-6 mb-8 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Select Gram Panchayat</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Choose any village in Telangana to explore its Sarpanch and Ward Members directory.
                </p>
              </div>
              {!needsPick && (
                <button
                  onClick={() => setShowSelector(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">District</label>
                <select
                  className="w-full p-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-pink-500 focus:outline-none"
                  value={district}
                  onChange={(e) => {
                    const next = sanitizeGeoSelection(e.target.value, '', '');
                    setDistrict(next.district);
                    setMandal(next.mandal);
                    setVillage(next.village);
                  }}
                >
                  <option value="">Select District</option>
                  {telanganaData.map((d: District) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mandal</label>
                <select
                  disabled={!district}
                  className="w-full p-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-pink-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                  value={mandal}
                  onChange={(e) => {
                    setMandal(e.target.value);
                    setVillage('');
                  }}
                >
                  <option value="">Select Mandal</option>
                  {district &&
                    getMandalNames(district).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Village</label>
                <select
                  disabled={!mandal}
                  className="w-full p-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-pink-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                >
                  <option value="">Select Village</option>
                  {district &&
                    mandal &&
                    getVillageNames(district, mandal).map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              {!needsPick && (
                <button
                  type="button"
                  onClick={() => setShowSelector(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                disabled={!district || !mandal || !village}
                onClick={() => lookupFor(district, mandal, village)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-blue-600 text-white font-semibold text-sm disabled:opacity-50 hover:shadow-md transition"
              >
                View Village Directory
              </button>
            </div>
          </div>
        )}

        {dirLoading && (
          <div className="text-center py-16">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-pink-500" />
            <p className="text-gray-500 text-sm mt-3">Loading representatives…</p>
          </div>
        )}

        {/* Sarpanch Card */}
        {directory?.sarpanch && !dirLoading && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-900">Gram Panchayat Sarpanch</h2>
            </div>
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl shadow-xl overflow-hidden text-white border-2 border-purple-200">
              <div className="bg-white/10 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-400/20 rounded-xl">
                    <Crown className="w-6 h-6 text-yellow-300" />
                  </div>
                  <div>
                    <span className="text-white font-bold text-lg">
                      Sarpanch of {directory.village?.village}
                    </span>
                    <p className="text-xs text-purple-200">Executive Head of Gram Panchayat</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-purple-800 shadow-sm">
                  SARPANCH
                </span>
              </div>

              <div className="bg-white p-6 text-gray-900">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-start space-x-3 bg-purple-50/60 p-3.5 rounded-2xl border border-purple-100">
                    <div className="bg-purple-100 p-2.5 rounded-xl">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500">Name</p>
                      <p className="text-base font-bold text-gray-900 truncate">
                        {directory.sarpanch.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100">
                    <div className="bg-blue-100 p-2.5 rounded-xl">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500">Jurisdiction</p>
                      <p className="text-base font-bold text-gray-900 truncate">
                        {directory.village?.village}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {directory.village?.mandal}, {directory.village?.district}
                      </p>
                    </div>
                  </div>

                  {directory.sarpanch.phone && (
                    <div className="flex items-start space-x-3 bg-green-50/60 p-3.5 rounded-2xl border border-green-100">
                      <div className="bg-green-100 p-2.5 rounded-xl">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500">Contact</p>
                        <a
                          href={`tel:${directory.sarpanch.phone}`}
                          className="text-base font-bold text-blue-600 hover:text-blue-700 truncate block"
                        >
                          {directory.sarpanch.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {directory.sarpanch.email && (
                    <div className="flex items-start space-x-3 bg-orange-50/60 p-3.5 rounded-2xl border border-orange-100">
                      <div className="bg-orange-100 p-2.5 rounded-xl">
                        <Mail className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500">Email</p>
                        <a
                          href={`mailto:${directory.sarpanch.email}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 break-all block"
                        >
                          {directory.sarpanch.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ward Members Section */}
        {directory && !needsPick && !dirLoading && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                    Ward Members ({directory.wardMembers.length} Registered Wards)
                  </h2>
                  <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                    {directory.village?.village} Gram Panchayat has {directory.wardMembers.length} active ward representatives.
                  </p>
                </div>

                {/* Search Box */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Ward #, Name, Phone…"
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {searchQuery && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Showing {filteredWardMembers.length} of {directory.wardMembers.length} ward members
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-pink-600 font-semibold hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>

            {filteredWardMembers.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-bold text-gray-800 text-lg">No ward members found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {searchQuery
                    ? `No ward member matches '${searchQuery}'. Try another search query.`
                    : 'No ward members are currently registered for this village.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredWardMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 hover:border-pink-200 overflow-hidden transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3.5 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-lg tracking-wide">
                            {member.wardNumber ? `Ward ${member.wardNumber}` : 'Ward Member'}
                          </span>
                        </div>
                        <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
                          Representative
                        </span>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="bg-pink-50 p-2.5 rounded-xl flex-shrink-0">
                            <User className="w-5 h-5 text-pink-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                              Member Name
                            </p>
                            <p className="text-base font-bold text-gray-900 leading-snug">
                              {member.name}
                            </p>
                          </div>
                        </div>

                        {member.phone && (
                          <div className="flex items-start gap-3">
                            <div className="bg-blue-50 p-2.5 rounded-xl flex-shrink-0">
                              <Phone className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                Contact Number
                              </p>
                              <a
                                href={`tel:${member.phone}`}
                                className="text-sm font-bold text-blue-600 hover:text-blue-700 block"
                              >
                                {member.phone}
                              </a>
                            </div>
                          </div>
                        )}

                        {member.email && (
                          <div className="flex items-start gap-3">
                            <div className="bg-purple-50 p-2.5 rounded-xl flex-shrink-0">
                              <Mail className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                Official Email
                              </p>
                              <a
                                href={`mailto:${member.email}`}
                                className="text-xs font-semibold text-purple-700 hover:text-purple-800 break-all block"
                              >
                                {member.email}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer with Quick Action */}
                    {member.phone && (
                      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
                        <a
                          href={`tel:${member.phone}`}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Representative</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
