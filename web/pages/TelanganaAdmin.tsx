import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, MapPin, Users, Building2, Search, X, ChevronRight, ExternalLink, Camera } from 'lucide-react';
import { telanganaData, getTotalVillages, getTotalMandals, type District, type Mandal } from '@shared/data/telangana';
import { useNavigate } from 'react-router';
import { usePlaceImages } from '@web/hooks/usePlaceImages';
import { useApi } from '@web/hooks/useApi';
import ConfigurePlaceImageModal from '@web/components/ConfigurePlaceImageModal';
import type { PlaceLevel, User } from '@shared/types';

type ViewLevel = 'districts' | 'mandals' | 'villages';

export default function TelanganaAdmin() {
  const navigate = useNavigate();
  const { data: userData } = useApi<{ user: User }>('/api/users/me');
  const me = userData?.user;
  const { isAdmin, getPlaceImage, getExactPlaceImage, refetch } = usePlaceImages();
  const isMandal = me?.role === 'mandal_official';
  const isVillageScoped = me?.role === 'sarpanch' || me?.role === 'ward_member' || me?.role === 'citizen';

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

  // Automatically lock mandal officials and village-scoped users to their permitted scope
  useEffect(() => {
    if (!me) return;
    if (isMandal && me.district && me.mandal) {
      const d = telanganaData.find((x) => x.name.toLowerCase() === me.district?.toLowerCase());
      const m = d?.mandals.find((x) => x.name.toLowerCase() === me.mandal?.toLowerCase());
      if (d && m) {
        setSelectedDistrict(d);
        setSelectedMandal(m);
        setViewLevel('villages');
      }
    } else if (isVillageScoped && me.district && me.mandal && me.village) {
      const d = telanganaData.find((x) => x.name.toLowerCase() === me.district?.toLowerCase());
      const m = d?.mandals.find((x) => x.name.toLowerCase() === me.mandal?.toLowerCase());
      if (d && m) {
        setSelectedDistrict(d);
        setSelectedMandal(m);
        setViewLevel('villages');
      }
    }
  }, [me, isMandal, isVillageScoped]);

  const handleDistrictClick = (district: District) => {
    if (isMandal || isVillageScoped) return;
    setSelectedDistrict(district);
    setViewLevel('mandals');
    setSearchQuery('');
  };

  const handleMandalClick = (mandal: Mandal) => {
    if (isVillageScoped) return;
    setSelectedMandal(mandal);
    setViewLevel('villages');
    setSearchQuery('');
  };

  const handleBack = () => {
    setSearchQuery('');
    if (isMandal || isVillageScoped) {
      return; // Locked to assigned jurisdiction
    }
    if (viewLevel === 'villages') {
      setSelectedMandal(null);
      setViewLevel('mandals');
    } else if (viewLevel === 'mandals') {
      setSelectedDistrict(null);
      setViewLevel('districts');
    }
  };

  const filteredDistricts = useMemo(() => {
    let list = telanganaData;
    if (isMandal && me?.district) {
      list = list.filter((d) => d.name.toLowerCase() === me.district?.toLowerCase());
    } else if (isVillageScoped && me?.district) {
      list = list.filter((d) => d.name.toLowerCase() === me.district?.toLowerCase());
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.mandals.some(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.villages.some((v) => v.name.toLowerCase().includes(q))
        )
    );
  }, [searchQuery, isMandal, isVillageScoped, me?.district]);

  const filteredMandals = useMemo(() => {
    if (!selectedDistrict) return [];
    let list = selectedDistrict.mandals;
    if (isMandal && me?.mandal) {
      list = list.filter((m) => m.name.toLowerCase() === me.mandal?.toLowerCase());
    } else if (isVillageScoped && me?.mandal) {
      list = list.filter((m) => m.name.toLowerCase() === me.mandal?.toLowerCase());
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.villages.some((v) => v.name.toLowerCase().includes(q))
    );
  }, [selectedDistrict, searchQuery, isMandal, isVillageScoped, me?.mandal]);

  const filteredVillages = useMemo(() => {
    if (!selectedMandal) return [];
    let list = selectedMandal.villages;
    if (isVillageScoped && me?.village) {
      list = list.filter((v) => v.name.toLowerCase() === me.village?.toLowerCase());
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((v) => v.name.toLowerCase().includes(q));
  }, [selectedMandal, searchQuery, isVillageScoped, me?.village]);

  return (
    <div className="space-y-6 animate-in">
      {/* Hero Header Banner */}
      <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-r from-[#67001A] via-[#520015] to-[#400010] text-white shadow-xl relative overflow-hidden border border-[#CCB252]/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CCB252]/20 border border-[#CCB252]/50 text-[#CCB252] text-xs font-black uppercase tracking-wider">
              <Building2 size={14} />
              <span>
                {isMandal
                  ? `${me?.mandal} Mandal Directory`
                  : isVillageScoped
                  ? `${me?.village} Village Jurisdiction`
                  : 'Telangana State Directory'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-black tracking-tight text-white">
              {isMandal
                ? `${me?.mandal} Mandal Villages`
                : isVillageScoped
                ? `${me?.village} Directory & Logs`
                : 'Districts & Villages Directory'}
            </h1>
            <p className="text-white/80 text-xs md:text-sm leading-relaxed">
              {isMandal
                ? `Explore villages and Gram Panchayats in ${me?.mandal} Mandal (${me?.district} District). Drill down to view local civic issues and Panchayat representatives.`
                : isVillageScoped
                ? `View local civic logs and Panchayat leadership for ${me?.village}, ${me?.mandal} Mandal (${me?.district} District).`
                : 'Explore the administrative hierarchy of Telangana across 33 Districts, 594 Mandals, and 12,769 Gram Panchayats. Drill down to view local civic issues and Panchayat representatives.'}
            </p>
          </div>

          {/* Quick Stat Counters */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0 bg-white/10 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-white/15">
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Building2 className="w-4 h-4 text-[#CCB252]" />
                <span className="text-xl sm:text-2xl font-black tabular-nums">{isMandal || isVillageScoped ? 1 : telanganaData.length}</span>
              </div>
              <p className="text-[10px] text-white/80 font-bold uppercase tracking-wide">Districts</p>
            </div>
            <div className="text-center px-2 border-x border-white/15">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <MapPin className="w-4 h-4 text-[#CCB252]" />
                <span className="text-xl sm:text-2xl font-black tabular-nums">{isMandal || isVillageScoped ? 1 : getTotalMandals()}</span>
              </div>
              <p className="text-[10px] text-white/80 font-bold uppercase tracking-wide">Mandals</p>
            </div>
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Users className="w-4 h-4 text-[#CCB252]" />
                <span className="text-xl sm:text-2xl font-black tabular-nums">{isVillageScoped ? 1 : isMandal ? (selectedMandal?.villages.length ?? 0) : getTotalVillages()}</span>
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
          {!isMandal && !isVillageScoped && viewLevel !== 'districts' && (
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
            {!isMandal && !isVillageScoped ? (
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
            ) : (
              <span className="text-slate-500">Telangana</span>
            )}

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
                      className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 aspect-[4/3] flex flex-col justify-end"
                    >
                      {/* Background image — both custom and default get hover zoom */}
                      <img
                        src={placeImg?.imageUrl || '/default-district.jpg'}
                        alt={placeImg?.caption || district.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Layer 1: permanent dark tint — guarantees text is ALWAYS readable */}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />

                      {/* Layer 2: strong bottom gradient for the text zone */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent group-hover:from-black/80 transition-all duration-300" />

                      {/* Top-right: admin edit button */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPlace({ level: 'district', district: district.name });
                          }}
                          className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-black/50 hover:bg-black/70 text-white/90 rounded-xl text-[10px] font-bold shadow flex items-center gap-1 backdrop-blur-sm transition-all z-10 opacity-0 group-hover:opacity-100"
                        >
                          <Camera size={11} /> {placeImg?.imageUrl ? 'Edit Photo' : '+ Add Photo'}
                        </button>
                      )}

                      {/* Bottom content — backdrop-blur panel for extra legibility */}
                      <div className="relative z-10 p-4">
                        {placeImg?.caption && (
                          <span className="inline-block text-[10px] font-bold text-[#CCB252] uppercase tracking-widest mb-1 drop-shadow-sm">
                            {placeImg.caption}
                          </span>
                        )}
                        <h3
                          className="text-lg font-black text-white leading-tight tracking-tight"
                          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                        >
                          {district.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold border border-white/10">
                            <Building2 size={9} /> {district.mandals.length} Mandals
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold border border-white/10">
                            <MapPin size={9} /> {totalVillages} Villages
                          </span>
                          <span className="ml-auto inline-flex items-center gap-0.5 text-white/60 text-[10px] font-bold group-hover:text-white transition-colors duration-200">
                            Explore <ChevronRight size={11} className="group-hover:translate-x-1 transition-transform duration-200" />
                          </span>
                        </div>
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
                      className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 aspect-[4/3] flex flex-col justify-end"
                    >
                      {/* Background — both custom and default get hover zoom */}
                      <img
                        src={placeImg?.imageUrl || '/default-mandal.jpg'}
                        alt={placeImg?.caption || mandal.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Layer 1: permanent dark tint */}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />

                      {/* Layer 2: strong bottom gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent group-hover:from-black/80 transition-all duration-300" />

                      {/* Admin edit button */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPlace({ level: 'mandal', district: selectedDistrict.name, mandal: mandal.name });
                          }}
                          className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-black/50 hover:bg-black/70 text-white/90 rounded-xl text-[10px] font-bold shadow flex items-center gap-1 backdrop-blur-sm transition-all z-10 opacity-0 group-hover:opacity-100"
                        >
                          <Camera size={11} /> {placeImg?.imageUrl ? 'Edit Photo' : '+ Add Photo'}
                        </button>
                      )}

                      {/* Bottom text */}
                      <div className="relative z-10 p-4">
                        {placeImg?.caption && (
                          <span className="inline-block text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1 drop-shadow-sm">
                            {placeImg.caption}
                          </span>
                        )}
                        <h3
                          className="text-lg font-black text-white leading-tight tracking-tight"
                          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                        >
                          {mandal.name} Mandal
                        </h3>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold border border-white/10">
                            <MapPin size={9} /> {mandal.villages.length} Villages
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white/80 text-[10px] font-semibold border border-white/10">
                            {selectedDistrict.name}
                          </span>
                          <span className="ml-auto inline-flex items-center gap-0.5 text-white/60 text-[10px] font-bold group-hover:text-white transition-colors duration-200">
                            Explore <ChevronRight size={11} className="group-hover:translate-x-1 transition-transform duration-200" />
                          </span>
                        </div>
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
                      className="group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 aspect-[4/5] flex flex-col justify-end"
                    >
                      {/* Background — both custom and default get hover zoom */}
                      <img
                        src={placeImg?.imageUrl || '/default-village.jpg'}
                        alt={placeImg?.caption || village.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Layer 1: permanent dark tint */}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />

                      {/* Layer 2: strong bottom gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent group-hover:from-black/85 transition-all duration-300" />

                      {/* Admin edit button */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setEditingPlace({ level: 'village', district: selectedDistrict.name, mandal: selectedMandal.name, village: village.name })}
                          className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-black/50 hover:bg-black/70 text-white/90 rounded-xl text-[10px] font-bold shadow flex items-center gap-1 backdrop-blur-sm transition-all z-10 opacity-0 group-hover:opacity-100"
                        >
                          <Camera size={11} /> {placeImg?.imageUrl ? 'Edit' : '+ Photo'}
                        </button>
                      )}

                      {/* Bottom info + actions */}
                      <div className="relative z-10 p-3">
                        {placeImg?.caption && (
                          <span className="inline-block text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-0.5 drop-shadow-sm">
                            {placeImg.caption}
                          </span>
                        )}
                        <h3
                          className="text-base font-black text-white leading-tight tracking-tight truncate"
                          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                        >
                          {village.name}
                        </h3>
                        {village.population ? (
                          <p className="text-[11px] text-white/80 mb-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>Pop: {village.population.toLocaleString('en-IN')}</p>
                        ) : (
                          <p className="text-[11px] text-white/70 mb-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>Gram Panchayat</p>
                        )}
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const p = new URLSearchParams();
                              p.set('district', selectedDistrict.name);
                              p.set('mandal', selectedMandal.name);
                              p.set('village', village.name);
                              navigate(`/telangana/issues?${p.toString()}`);
                            }}
                            className="w-full py-1.5 px-3 rounded-xl bg-[#67001A] hover:bg-[#520015] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                          >
                            <span>View Village Logs</span>
                            <ExternalLink size={11} />
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
                            className="w-full py-1.5 px-3 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/15 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                          >
                            Panchayat Directory
                          </button>
                        </div>
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
