import { useState } from 'react';
import { ArrowLeft, MapPin, Users, Building2 } from 'lucide-react';
import { telanganaData, getTotalVillages, getTotalMandals, type District, type Mandal } from '@shared/data/telangana';
import { useNavigate } from 'react-router';

type ViewLevel = 'districts' | 'mandals' | 'villages';

function DemoStatsBar({ label }: { label: string }) {
  return (
    <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
      <span className="font-black uppercase tracking-wider">DEMO DATA</span>
      <span className="mx-2">•</span>
      <span>{label} — illustrative governance metrics (not official statistics)</span>
    </div>
  );
}

export default function TelanganaAdmin() {
  const [viewLevel, setViewLevel] = useState<ViewLevel>('districts');
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedMandal, setSelectedMandal] = useState<Mandal | null>(null);
  const navigate = useNavigate();

  const handleDistrictClick = (district: District) => {
    setSelectedDistrict(district);
    setViewLevel('mandals');
  };

  const handleMandalClick = (mandal: Mandal) => {
    setSelectedMandal(mandal);
    setViewLevel('villages');
  };

  const handleBack = () => {
    if (viewLevel === 'villages') {
      setSelectedMandal(null);
      setViewLevel('mandals');
    } else if (viewLevel === 'mandals') {
      setSelectedDistrict(null);
      setViewLevel('districts');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-heading text-[#67001A]">Telangana Command Center</h1>
          <p className="text-sm text-[#64748B] mt-1 font-telugu telugu-text">తెలంగాణ రాష్ట్ర నిర్వాహక డాష్‌బోర్డ్</p>
        </div>
      </header>

      <div className="bg-[#67001A] text-white py-5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building2 className="w-5 h-5 text-[#CCB252]" aria-hidden />
                <span className="text-2xl font-bold tabular-nums">{telanganaData.length}</span>
              </div>
              <p className="text-xs text-white/80 font-semibold uppercase tracking-wide">Districts</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <MapPin className="w-5 h-5 text-[#CCB252]" aria-hidden />
                <span className="text-2xl font-bold tabular-nums">{getTotalMandals()}</span>
              </div>
              <p className="text-xs text-white/80 font-semibold uppercase tracking-wide">Mandals</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="w-5 h-5 text-[#CCB252]" aria-hidden />
                <span className="text-2xl font-bold tabular-nums">{getTotalVillages()}</span>
              </div>
              <p className="text-xs text-white/80 font-semibold uppercase tracking-wide">Villages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-3">
          {viewLevel !== 'districts' && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all text-gray-700 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          )}
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <span className={viewLevel === 'districts' ? 'text-orange-600' : 'text-gray-500'}>
              Telangana
            </span>
            {selectedDistrict && (
              <>
                <span className="text-gray-400">/</span>
                <span className={viewLevel === 'mandals' ? 'text-orange-600' : 'text-gray-500'}>
                  {selectedDistrict.name}
                </span>
              </>
            )}
            {selectedMandal && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-orange-600">{selectedMandal.name}</span>
              </>
            )}
          </div>
        </div>

        {/* Districts View */}
        {viewLevel === 'districts' && (
          <div>
            <DemoStatsBar label="State-level drill-down" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Select District</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {telanganaData.map((district) => (
                <button
                  key={district.name}
                  onClick={() => handleDistrictClick(district)}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 p-6 text-left group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Building2 className="w-8 h-8 text-orange-500 group-hover:scale-110 transition-transform" />
                    <div className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
                      {district.mandals.length} Mandals
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {district.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {district.mandals.reduce((total, mandal) => total + mandal.villages.length, 0)} Villages
                  </p>
                  <p className="text-[10px] text-orange-600 font-bold mt-2 uppercase">Tap to drill down → Mandals</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mandals View */}
        {viewLevel === 'mandals' && selectedDistrict && (
          <div>
            <DemoStatsBar label={`District: ${selectedDistrict.name}`} />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mandals in {selectedDistrict.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedDistrict.mandals.map((mandal) => (
                <button
                  key={mandal.name}
                  onClick={() => handleMandalClick(mandal)}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 p-6 text-left group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <MapPin className="w-8 h-8 text-pink-500 group-hover:scale-110 transition-transform" />
                    <div className="bg-pink-100 text-pink-700 text-xs font-bold px-2 py-1 rounded-full">
                      {mandal.villages.length} Villages
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                    {mandal.name}
                  </h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Villages View */}
        {viewLevel === 'villages' && selectedMandal && (
          <div>
            <DemoStatsBar label={`Mandal: ${selectedMandal.name} → Villages → Issues`} />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Villages in {selectedMandal.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {selectedMandal.villages.map((village) => (
                <div
                  key={village.name}
                  className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 p-5"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{village.name}</h3>
                      {village.population && (
                        <p className="text-sm text-gray-600 mt-1">
                          Population: {village.population.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        const district = selectedDistrict?.name ?? "";
                        const mandal = selectedMandal?.name ?? "";
                        const v = village.name ?? "";
                        const params = new URLSearchParams();
                        if (district) params.set("district", district);
                        if (mandal) params.set("mandal", mandal);
                        if (v) params.set("village", v);
                        navigate(`/telangana/issues?${params.toString()}`);
                      }}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all"
                    >
                      View Issues
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
