import { useState, useMemo } from 'react';
import { ArrowLeft, MapPin, Users, Building2, Search, X, ChevronRight, ExternalLink, Camera } from 'lucide-react';
import { telanganaData, getTotalVillages, getTotalMandals, type District, type Mandal } from '@shared/data/telangana';
import { useNavigate } from 'react-router';
import { usePlaceImages } from '@web/hooks/usePlaceImages';
import ConfigurePlaceImageModal from '@web/components/ConfigurePlaceImageModal';
import type { PlaceLevel } from '@shared/types';

type ViewLevel = 'districts' | 'mandals' | 'villages';

export default function TelanganaAdmin() {
  const navigate = useNavigate();
  const { isAdmin, getPlaceImage, getExactPlaceImage, refetch } = usePlaceImages();
  const [editingPlace, setEditingPlace] = useState<{
    level: PlaceLevel;
    district: string;
    mandal?: string;
    village?: string;
  } | null>(null);

  const [viewLevel, setViewLevel] = useState<ViewLevel>('districts');
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedMandal, setSelectedMandal] = useState<Mandal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDistrictClick = (district: District) => {
    setSelectedDistrict(district);
    setViewLevel('mandals');
    setSearchQuery('');
  };

  const handleMandalClick = (mandal: Mandal) => {
    setSelectedMandal(mandal);
    setViewLevel('villages');
    setSearchQuery('');
  };

  const handleBack = () => {
    setSearchQuery('');
    if (viewLevel === 'villages') {
      setSelectedMandal(null);
      setViewLevel('mandals');
    } else if (viewLevel === 'mandals') {
      setSelectedDistrict(null);
      setViewLevel('districts');
    }
  };

  const filteredDistricts = useMemo(() => {
    if (!searchQuery.trim()) return telanganaData;
    const q = searchQuery.toLowerCase().trim();
    return telanganaData.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.mandals.some(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.villages.some((v) => v.name.toLowerCase().includes(q))
        )
    );
  }, [searchQuery]);

  const filteredMandals = useMemo(() => {
    if (!selectedDistrict) return [];
    if (!searchQuery.trim()) return selectedDistrict.mandals;
    const q = searchQuery.toLowerCase().trim();
    return selectedDistrict.mandals.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.villages.some((v) => v.name.toLowerCase().includes(q))
    );
  }, [selectedDistrict, searchQuery]);

  const filteredVillages = useMemo(() => {
    if (!selectedMandal) return [];
    if (!searchQuery.trim()) return selectedMandal.villages;
    const q = searchQuery.toLowerCase().trim();
    return selectedMandal.villages.filter((v) => v.name.toLowerCase().includes(q));
  }, [selectedMandal, searchQuery]);

  return (
    <div className="space-y-6 animate-in">
      {/* Hero Header Banner */}
      <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-r from-[#67001A] via-[#520015] to-[#400010] text-white shadow-xl relative overflow-hidden border border-[#CCB252]/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CCB252]/20 border border-[#CCB252]/50 text-[#CCB252] text-xs font-black uppercase tracking-wider">
              <Building2 size={14} />
              <span>Telangana State Directory</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-black tracking-tight text-white">
              Districts & Villages Directory
            </h1>
            <p className="text-white/80 text-xs md:text-sm leading-relaxed">
              Explore the administrative hierarchy of Telangana across <strong>33 Districts</strong>,{' '}
              <strong>594 Mandals</strong>, and <strong>12,769 Gram Panchayats</strong>. Drill down to view local civic issues and Panchayat representatives.
            </p>
          </div>

          {/* Quick Stat Counters */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0 bg-white/10 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-white/15">
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Building2 className="w-4 h-4 text-[#CCB252]" />
                <span className="text-xl sm:text-2xl font-black tabular-nums">{telanganaData.length}</span>
              </div>
              <p className="text-[10px] text-white/80 font-bold uppercase tracking-wide">Districts</p>
            </div>
            <div className="text-center px-2 border-x border-white/15">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <MapPin className="w-4 h-4 text-[#CCB252]" />
                <span className="text-xl sm:text-2xl font-black tabular-nums">{getTotalMandals()}</span>
              </div>
              <p className="text-[10px] text-white/80 font-bold uppercase tracking-wide">Mandals</p>
            </div>
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Users className="w-4 h-4 text-[#CCB252]" />
                <span className="text-xl sm:text-2xl font-black tabular-nums">{getTotalVillages()}</span>
              </div>
              <p className="text-[10px] text-white/80 font-bold uppercase tracking-wide">Villages</p>
            </div>
          </div>
        </div>

        {/* Subtle glow */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-[#CCB252]/10 blur-3xl pointer-events-none" />
      </div>

      {/* Navigation Breadcrumb and Search Bar */}
      <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-3 flex-wrap">
          {viewLevel !== 'districts' && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-bold transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <button
              type="button"
              onClick={() => {
                setSelectedDistrict(null);
                setSelectedMandal(null);
                setViewLevel('districts');
                setSearchQuery('');
              }}
              className={`hover:underline transition-colors ${
                viewLevel === 'districts' ? 'text-[#67001A]' : 'text-slate-500'
              }`}
            >
              Telangana (33 Districts)
            </button>

            {selectedDistrict && (
              <>
                <ChevronRight size={14} className="text-slate-400" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMandal(null);
                    setViewLevel('mandals');
                    setSearchQuery('');
                  }}
                  className={`hover:underline transition-colors ${
                    viewLevel === 'mandals' ? 'text-[#67001A]' : 'text-slate-500'
                  }`}
                >
                  {selectedDistrict.name} District
                </button>
              </>
            )}

            {selectedMandal && (
              <>
                <ChevronRight size={14} className="text-slate-400" />
                <span className="text-[#67001A]">{selectedMandal.name} Mandal</span>
              </>
            )}
          </div>
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px] md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              viewLevel === 'districts'
                ? 'Search district, mandal, or village...'
                : viewLevel === 'mandals'
                ? `Search mandal in ${selectedDistrict?.name}...`
                : `Search village in ${selectedMandal?.name}...`
            }
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#67001A]/30 focus:border-[#67001A]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {/* Districts View */}
        {viewLevel === 'districts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Select a District to Explore Mandals & Villages
              </h2>
              <span className="text-xs font-bold text-slate-500">
                {filteredDistricts.length} of {telanganaData.length} districts
              </span>
            </div>

            {filteredDistricts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <p className="text-sm font-semibold text-slate-700">No districts match "{searchQuery}"</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDistricts.map((district) => {
                  const totalVillages = district.mandals.reduce((tot, m) => tot + m.villages.length, 0);
                  const placeImg = getPlaceImage('district', district.name);
                  return (
                    <div
                      key={district.name}
                      onClick={() => handleDistrictClick(district)}
                      className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-[#67001A]/40 transition-all text-left group flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        {placeImg?.imageUrl ? (
                          <div className="w-full h-32 rounded-2xl overflow-hidden relative mb-3 bg-slate-100 group">
                            <img
                              src={placeImg.imageUrl}
                              alt={placeImg.caption || district.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {placeImg.caption && (
                              <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md truncate max-w-[80%]">
                                {placeImg.caption}
                              </span>
                            )}
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPlace({ level: 'district', district: district.name });
                                }}
                                className="absolute top-2 right-2 px-2 py-1 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-[10px] font-bold shadow-xs flex items-center gap-1 transition-all z-10"
                              >
                                <Camera size={12} /> Edit Photo
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#67001A]/10 text-[#67001A] flex items-center justify-center group-hover:scale-105 transition-transform">
                              <Building2 size={20} />
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingPlace({ level: 'district', district: district.name });
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#67001A] hover:bg-slate-100 text-[10px] font-bold flex items-center gap-1 transition-all"
                                  title="Configure district landmark photo"
                                >
                                  <Camera size={14} />
                                </button>
                              )}
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                                {district.mandals.length} Mandals
                              </span>
                            </div>
                          </div>
                        )}

                        <h3 className="text-base font-black text-slate-900 group-hover:text-[#67001A] transition-colors">
                          {district.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {totalVillages} Gram Panchayats
                        </p>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#67001A]">
                        <span>Explore Mandals</span>
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Mandals View */}
        {viewLevel === 'mandals' && selectedDistrict && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Mandals in {selectedDistrict.name} District
              </h2>
              <span className="text-xs font-bold text-slate-500">
                {filteredMandals.length} of {selectedDistrict.mandals.length} mandals
              </span>
            </div>

            {filteredMandals.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <p className="text-sm font-semibold text-slate-700">No mandals match "{searchQuery}"</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMandals.map((mandal) => {
                  const placeImg = getPlaceImage('mandal', selectedDistrict.name, mandal.name);
                  return (
                    <div
                      key={mandal.name}
                      onClick={() => handleMandalClick(mandal)}
                      className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-[#67001A]/40 transition-all text-left group flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        {placeImg?.imageUrl ? (
                          <div className="w-full h-32 rounded-2xl overflow-hidden relative mb-3 bg-slate-100 group">
                            <img
                              src={placeImg.imageUrl}
                              alt={placeImg.caption || mandal.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {placeImg.caption && (
                              <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md truncate max-w-[80%]">
                                {placeImg.caption}
                              </span>
                            )}
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPlace({ level: 'mandal', district: selectedDistrict.name, mandal: mandal.name });
                                }}
                                className="absolute top-2 right-2 px-2 py-1 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-[10px] font-bold shadow-xs flex items-center gap-1 transition-all z-10"
                              >
                                <Camera size={12} /> Edit Photo
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <MapPin size={20} />
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingPlace({ level: 'mandal', district: selectedDistrict.name, mandal: mandal.name });
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-slate-100 text-[10px] font-bold flex items-center gap-1 transition-all"
                                  title="Configure mandal landmark photo"
                                >
                                  <Camera size={14} />
                                </button>
                              )}
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                                {mandal.villages.length} Villages
                              </span>
                            </div>
                          </div>
                        )}

                        <h3 className="text-base font-black text-slate-900 group-hover:text-[#67001A] transition-colors">
                          {mandal.name} Mandal
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          District: {selectedDistrict.name}
                        </p>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#67001A]">
                        <span>Explore Villages</span>
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Villages View */}
        {viewLevel === 'villages' && selectedDistrict && selectedMandal && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Villages & Gram Panchayats in {selectedMandal.name} Mandal
              </h2>
              <span className="text-xs font-bold text-slate-500">
                {filteredVillages.length} of {selectedMandal.villages.length} villages
              </span>
            </div>

            {filteredVillages.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <p className="text-sm font-semibold text-slate-700">No villages match "{searchQuery}"</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredVillages.map((village) => {
                  const placeImg = getPlaceImage('village', selectedDistrict.name, selectedMandal.name, village.name);
                  return (
                    <div
                      key={village.name}
                      className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {placeImg?.imageUrl ? (
                          <div className="w-full h-32 rounded-2xl overflow-hidden relative mb-3 bg-slate-100 group">
                            <img
                              src={placeImg.imageUrl}
                              alt={placeImg.caption || village.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {placeImg.caption && (
                              <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md truncate max-w-[80%]">
                                {placeImg.caption}
                              </span>
                            )}
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingPlace({
                                    level: 'village',
                                    district: selectedDistrict.name,
                                    mandal: selectedMandal.name,
                                    village: village.name,
                                  })
                                }
                                className="absolute top-2 right-2 px-2 py-1 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-[10px] font-bold shadow-xs flex items-center gap-1 transition-all z-10"
                              >
                                <Camera size={12} /> Edit Photo
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                <Users size={20} />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-base font-black text-slate-900 truncate">
                                  {village.name}
                                </h3>
                                {village.population ? (
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    Pop: {village.population.toLocaleString('en-IN')}
                                  </p>
                                ) : (
                                  <p className="text-xs text-slate-400 mt-0.5">Gram Panchayat</p>
                                )}
                              </div>
                            </div>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingPlace({
                                    level: 'village',
                                    district: selectedDistrict.name,
                                    mandal: selectedMandal.name,
                                    village: village.name,
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100 text-[10px] font-bold flex items-center gap-1 transition-all"
                                title="Configure village landmark photo"
                              >
                                <Camera size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const p = new URLSearchParams();
                            p.set('district', selectedDistrict.name);
                            p.set('mandal', selectedMandal.name);
                            p.set('village', village.name);
                            navigate(`/telangana/issues?${p.toString()}`);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-[#67001A] hover:bg-[#520015] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <span>View Village Logs</span>
                          <ExternalLink size={12} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const p = new URLSearchParams();
                            p.set('district', selectedDistrict.name);
                            p.set('mandal', selectedMandal.name);
                            p.set('village', village.name);
                            navigate(`/sarpanches?${p.toString()}`);
                          }}
                          className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <span>Panchayat Directory</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Admin Place Image Configuration Modal */}
      {editingPlace && (
        <ConfigurePlaceImageModal
          isOpen={Boolean(editingPlace)}
          onClose={() => setEditingPlace(null)}
          place={editingPlace}
          currentRecord={getExactPlaceImage(
            editingPlace.level,
            editingPlace.district,
            editingPlace.mandal,
            editingPlace.village
          )}
          onSaved={() => void refetch()}
        />
      )}
    </div>
  );
}
