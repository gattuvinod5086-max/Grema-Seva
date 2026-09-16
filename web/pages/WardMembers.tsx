import { useMemo, useState } from 'react';
import { ArrowLeft, Phone, MapPin, User, Crown, Sparkles, Loader2 } from 'lucide-react';
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
 * app for a village. Citizens see their own village; admins can look up
 * any village.
 */
export function WardMembers() {
  const navigate = useNavigate();
  const { data: meData, isLoading: meLoading } = useApi<{ user: UserType }>('/api/users/me');
  const me = meData?.user ?? null;

  const [picked, setPicked] = useState<{ district: string; mandal: string; village: string } | null>(null);

  // Viewers with a village see it by default; admins pick one.
  const directoryUrl = useMemo(() => {
    if (me?.district && me?.mandal && me?.village) {
      return '/api/users/directory';
    }
    if (picked) {
      const p = new URLSearchParams(picked as Record<string, string>);
      return `/api/users/directory?${p}`;
    }
    return null;
  }, [me?.district, me?.mandal, me?.village, picked]);

  const { data: directory, isLoading: dirLoading } = useApi<DirectoryResponse>(directoryUrl ?? '/api/users/directory', {
    enabled: directoryUrl !== null,
  });

  const [district, setDistrict] = useState('');
  const [mandal, setMandal] = useState('');
  const [village, setVillage] = useState('');

  const lookupFor = (d: string, m: string, v: string) => setPicked({ district: d, mandal: m, village: v });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50">
      {/* Telangana Header Banner */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-5 h-5" />
            <p className="text-sm md:text-base font-bold">తెలంగాణ రాష్ట్రం | Telangana State | Village Representatives</p>
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
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-100 to-blue-100 rounded-xl hover:from-pink-200 hover:to-blue-200 transition-all shadow-md"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
              <span className="font-semibold text-gray-700">Back to Dashboard</span>
            </button>
            <UserProfileCapsule user={me} />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
              Sarpanch & Ward Members
            </h1>
            {directory?.village && (
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-pink-600" />
                <span className="font-semibold">
                  {directory.village.village}, {directory.village.mandal} - {directory.village.district} District
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Village lookup for admins and mandal officials */}
        {needsPick && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 max-w-md">
            <h2 className="font-bold text-gray-900 mb-1">Choose a village</h2>
            <p className="text-sm text-gray-500 mb-4">
              {me?.role === 'mandal_official'
                ? `Select a village in ${me.mandal} Mandal to view its registered representatives.`
                : 'Select a village to view its registered representatives.'}
            </p>
            <div className="space-y-2">
              {me?.role === 'mandal_official' && me.district && me.mandal ? (
                <>
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-900">
                    {me.mandal} Mandal · {me.district} District
                  </div>
                  <select
                    className="w-full p-3 rounded-xl border-2 border-gray-200 text-sm"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                  >
                    <option value="">Select Village</option>
                    {getVillageNames(me.district, me.mandal).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!village}
                    onClick={() => lookupFor(me.district!, me.mandal!, village)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-blue-600 text-white font-semibold disabled:opacity-50"
                  >
                    View directory
                  </button>
                </>
              ) : me?.role === 'admin' || me?.role === 'super_admin' ? (
                <>
                  <select
                    className="w-full p-3 rounded-xl border-2 border-gray-200 text-sm"
                    value={district}
                    onChange={(e) => {
                      const next = sanitizeGeoSelection(e.target.value, '', '');
                      setDistrict(next.district);
                      setMandal(next.mandal);
                      setVillage(next.village);
                    }}
                  >
                    <option value="">District</option>
                    {telanganaData.map((d: District) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                  {district && (
                    <select className="w-full p-3 rounded-xl border-2 border-gray-200 text-sm" value={mandal} onChange={(e) => { setMandal(e.target.value); setVillage(''); }}>
                      <option value="">Mandal</option>
                      {getMandalNames(district).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  )}
                  {mandal && (
                    <select className="w-full p-3 rounded-xl border-2 border-gray-200 text-sm" value={village} onChange={(e) => setVillage(e.target.value)}>
                      <option value="">Village</option>
                      {getVillageNames(district, mandal).map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    disabled={!village}
                    onClick={() => lookupFor(district, mandal, village)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-blue-600 text-white font-semibold disabled:opacity-50"
                  >
                    View directory
                  </button>
                </>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs">
                  Please complete your profile registration with your village jurisdiction to view representatives.
                </div>
              )}
            </div>
          </div>
        )}

        {dirLoading && !needsPick && (
          <div className="text-center py-16">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-pink-500" />
          </div>
        )}

        {/* Sarpanch Card */}
        {directory?.sarpanch && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-8 h-8 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900">Village Sarpanch</h2>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-3xl shadow-2xl overflow-hidden border-4 border-purple-200">
              <div className="bg-white/10 backdrop-blur-sm px-8 py-5">
                <div className="flex items-center space-x-3">
                  <Crown className="w-8 h-8 text-yellow-300" />
                  <span className="text-white font-bold text-2xl">Sarpanch of {directory.village?.village}</span>
                </div>
              </div>

              <div className="bg-white p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-100 p-4 rounded-xl">
                      <User className="w-7 h-7 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Name</p>
                      <p className="text-2xl font-bold text-gray-900">{directory.sarpanch.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-4 rounded-xl">
                      <MapPin className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Village</p>
                      <p className="text-xl font-bold text-gray-900">{directory.village?.village}</p>
                      <p className="text-sm text-gray-600">{directory.village?.mandal}, {directory.village?.district} District</p>
                    </div>
                  </div>

                  {directory.sarpanch.phone && (
                    <div className="flex items-start space-x-4">
                      <div className="bg-green-100 p-4 rounded-xl">
                        <Phone className="w-7 h-7 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-1">Contact</p>
                        <a
                          href={`tel:${directory.sarpanch.phone}`}
                          className="text-xl font-bold text-blue-600 hover:text-blue-700"
                        >
                          {directory.sarpanch.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {directory.sarpanch.email && (
                    <div className="flex items-start space-x-4">
                      <div className="bg-orange-100 p-4 rounded-xl">
                        <User className="w-7 h-7 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                        <a
                          href={`mailto:${directory.sarpanch.email}`}
                          className="text-lg font-bold text-blue-600 hover:text-blue-700 break-all"
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

        {/* Ward Members List */}
        {directory && !needsPick && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Ward Members
              </h2>
              <p className="text-gray-600">
                {directory.village?.village} — {directory.wardMembers.length} registered ward{' '}
                {directory.wardMembers.length === 1 ? 'member' : 'members'}
              </p>
            </div>

            {directory.wardMembers.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-8 text-center">
                <p className="font-semibold text-gray-800">No ward members registered yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Ward members appear here after they register and the super admin approves them.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {directory.wardMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-3xl shadow-lg hover:shadow-2xl border-2 border-gray-100 hover:border-pink-300 overflow-hidden transition-all transform hover:scale-[1.01]"
                  >
                    <div className="bg-gradient-to-r from-pink-500 to-blue-500 px-8 py-5">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold text-2xl">
                          {member.wardNumber ? `Ward ${member.wardNumber}` : 'Ward Member'}
                        </span>
                        <div className="bg-white px-6 py-2 rounded-full">
                          <span className="bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent font-bold text-sm">
                            WARD MEMBER
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-start space-x-4">
                          <div className="bg-gradient-to-br from-pink-100 to-blue-100 p-4 rounded-xl">
                            <User className="w-7 h-7 text-pink-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-1">Name</p>
                            <p className="text-xl font-bold text-gray-900">{member.name}</p>
                          </div>
                        </div>

                        {member.phone && (
                          <div className="flex items-start space-x-4">
                            <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-4 rounded-xl">
                              <Phone className="w-7 h-7 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-600 mb-1">Contact</p>
                              <a
                                href={`tel:${member.phone}`}
                                className="text-xl font-bold text-blue-600 hover:text-blue-700"
                              >
                                {member.phone}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
