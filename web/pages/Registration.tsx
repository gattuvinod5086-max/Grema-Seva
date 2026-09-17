import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, MapPin, CheckCircle, User, Phone, Users, Loader2, Search, X, ShieldAlert, Globe } from 'lucide-react';
import { telanganaData, type District, type Mandal, type Village } from '@shared/data/telangana';
import type { User as ApiUser } from '@shared/types';
import {
  isValidIndianMobile,
  personNameSchema,
  MOBILE_ERROR,
  NAME_ERROR,
} from '@shared/validation';
import { BRANDING } from '@web/constants/branding';
import PublicFooter from '@web/components/layout/PublicFooter';
import { usePlaceImages } from '@web/hooks/usePlaceImages';
import { useLanguage } from '@web/context/LanguageContext';

type Step = 'details' | 'district' | 'mandal' | 'village';

export default function Registration() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const { getPlaceImage } = usePlaceImages();

  const [user, setUser] = useState<ApiUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [step, setStep] = useState<Step>('details');

  // Citizen personal details
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // Location selection & search
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedMandal, setSelectedMandal] = useState<Mandal | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [detailErrors, setDetailErrors] = useState<{ name?: string; fatherName?: string; phone?: string }>({});

  // Memoized search filters
  const filteredDistricts = useMemo(() => {
    if (!searchFilter.trim()) return telanganaData;
    const term = searchFilter.toLowerCase();
    return telanganaData.filter((d) => d.name.toLowerCase().includes(term));
  }, [searchFilter]);

  const filteredMandals = useMemo(() => {
    if (!selectedDistrict) return [];
    if (!searchFilter.trim()) return selectedDistrict.mandals;
    const term = searchFilter.toLowerCase();
    return selectedDistrict.mandals.filter((m) => m.name.toLowerCase().includes(term));
  }, [selectedDistrict, searchFilter]);

  const filteredVillages = useMemo(() => {
    if (!selectedMandal) return [];
    if (!searchFilter.trim()) return selectedMandal.villages;
    const term = searchFilter.toLowerCase();
    return selectedMandal.villages.filter((v) => v.name.toLowerCase().includes(term));
  }, [selectedMandal, searchFilter]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/users/me', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled) return;
        const u = body?.user as ApiUser | undefined;
        if (u) {
          setUser(u);
          setFullName(u.name && u.name !== 'New User' ? u.name : '');
          if (u.fatherName) setFatherName(u.fatherName);
          if (u.phone) setMobileNumber(u.phone.replace(/^\+91/, ''));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#67001A]" />
      </div>
    );
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof detailErrors = {};

    if (!personNameSchema.safeParse(fullName).success) errors.name = NAME_ERROR;
    if (!personNameSchema.safeParse(fatherName).success) errors.fatherName = NAME_ERROR;
    if (!isValidIndianMobile(mobileNumber)) errors.phone = MOBILE_ERROR;

    setDetailErrors(errors);
    if (Object.keys(errors).length === 0) {
      setSearchFilter('');
      setStep('district');
    }
  };

  const handleDistrictSelect = (district: District) => {
    setSelectedDistrict(district);
    setSelectedMandal(null);
    setSearchFilter('');
    setStep('mandal');
  };

  const handleMandalSelect = (mandal: Mandal) => {
    setSelectedMandal(mandal);
    setSearchFilter('');
    setStep('village');
  };

  const handleVillageSelect = async (village: Village) => {
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      name: fullName.trim(),
      fatherName: fatherName.trim(),
      phone: mobileNumber.trim(),
      role: 'citizen',
      district: selectedDistrict!.name,
      mandal: selectedMandal!.name,
      village: village.name,
    };

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok) {
        navigate('/', { replace: true });
      } else {
        setSubmitError(body?.error?.message ?? (lang === 'te' ? 'నమోదు పూర్తి చేయడంలో లోపం సంభవించింది. దయచేసి మళ్ళీ ప్రయత్నించండి.' : 'Failed to complete citizen registration. Please try again.'));
        setIsSubmitting(false);
      }
    } catch {
      setSubmitError(lang === 'te' ? 'నెట్‌వర్క్ లోపం. దయచేసి మళ్ళీ ప్రయత్నించండి.' : 'Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setSearchFilter('');
    if (step === 'village') {
      setStep('mandal');
    } else if (step === 'mandal') {
      setSelectedMandal(null);
      setStep('district');
    } else if (step === 'district') {
      setStep('details');
    }
  };

  const getStepNumber = () => {
    switch (step) {
      case 'details': return 1;
      case 'district': return 2;
      case 'mandal': return 3;
      case 'village': return 4;
      default: return 1;
    }
  };

  const isTe = lang === 'te';

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between">
      <div>
        {/* Header */}
        <header className="bg-[#67001A] border-b-2 border-[#CCB252] shadow-md text-white py-3.5 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white p-1 shadow-sm border border-[#CCB252] flex items-center justify-center shrink-0">
                <img
                  src={BRANDING.logoEmblem}
                  alt="Telangana Government Emblem"
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
                />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-wide uppercase font-telugu">
                  {isTe ? 'తెలంగాణ ప్రభుత్వం · గ్రామ సేవ' : 'Government of Telangana · Grama Seva'}
                </h1>
                <p className="text-xs text-amber-200 font-medium">
                  {isTe ? 'పౌర ప్రొఫైల్ నమోదు' : 'Citizen Profile Registration'}
                </p>
              </div>
            </div>

            {/* Language Selector and Role Badge */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-xl bg-black/20 px-1.5 py-0.5 border border-[#CCB252]/50">
                <Globe className="w-3.5 h-3.5 text-[#FEF08A] shrink-0 ml-0.5" />
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    !isTe
                      ? 'bg-[#CCB252] text-[#67001A] shadow-xs'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLang('te')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer font-telugu ${
                    isTe
                      ? 'bg-[#CCB252] text-[#67001A] shadow-xs'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  తెలుగు
                </button>
              </div>

              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#CCB252]/20 border border-[#CCB252] text-[#FEF08A]">
                <User className="w-3.5 h-3.5 text-[#CCB252]" />
                {isTe ? 'పౌరుడు' : 'Citizen'}
              </span>
            </div>
          </div>
        </header>

        {/* 4-Step Progress Bar */}
        <div className="bg-white border-b border-gray-200 shadow-xs">
          <div className="max-w-4xl mx-auto px-4 py-3.5">
            <div className="flex items-center justify-between">
              {/* Step 1: Details */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  step === 'details' ? 'bg-[#67001A] text-white shadow-xs' : 'bg-emerald-600 text-white'
                }`}>
                  {step === 'details' ? '1' : <CheckCircle className="w-4 h-4" />}
                </div>
                <span className={`text-xs font-bold hidden sm:inline ${step === 'details' ? 'text-[#67001A]' : 'text-gray-900'}`}>
                  {isTe ? 'వివరాలు' : 'Details'}
                </span>
              </div>

              <div className="flex-1 h-1 mx-2 sm:mx-4 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${
                  getStepNumber() > 1 ? 'bg-emerald-600 w-full' : 'bg-gray-200 w-0'
                }`} />
              </div>

              {/* Step 2: District */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  step === 'district' ? 'bg-[#67001A] text-white shadow-xs' :
                  getStepNumber() > 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {getStepNumber() > 2 ? <CheckCircle className="w-4 h-4" /> : '2'}
                </div>
                <span className={`text-xs font-bold hidden sm:inline ${step === 'district' ? 'text-[#67001A]' : getStepNumber() > 2 ? 'text-gray-900' : 'text-gray-500'}`}>
                  {isTe ? 'జిల్లా' : 'District'}
                </span>
              </div>

              <div className="flex-1 h-1 mx-2 sm:mx-4 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${
                  getStepNumber() > 2 ? 'bg-emerald-600 w-full' : 'bg-gray-200 w-0'
                }`} />
              </div>

              {/* Step 3: Mandal */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  step === 'mandal' ? 'bg-[#67001A] text-white shadow-xs' :
                  getStepNumber() > 3 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {getStepNumber() > 3 ? <CheckCircle className="w-4 h-4" /> : '3'}
                </div>
                <span className={`text-xs font-bold hidden sm:inline ${step === 'mandal' ? 'text-[#67001A]' : getStepNumber() > 3 ? 'text-gray-900' : 'text-gray-500'}`}>
                  {isTe ? 'మండలం' : 'Mandal'}
                </span>
              </div>

              <div className="flex-1 h-1 mx-2 sm:mx-4 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${
                  getStepNumber() > 3 ? 'bg-emerald-600 w-full' : 'bg-gray-200 w-0'
                }`} />
              </div>

              {/* Step 4: Village */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  step === 'village' ? 'bg-[#67001A] text-white shadow-xs' : 'bg-gray-200 text-gray-600'
                }`}>
                  4
                </div>
                <span className={`text-xs font-bold hidden sm:inline ${step === 'village' ? 'text-[#67001A]' : 'text-gray-500'}`}>
                  {isTe ? 'గ్రామం' : 'Village'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {submitError && (
            <div className="max-w-2xl mx-auto mb-6 bg-red-50 border-2 border-red-300 rounded-xl p-4 text-red-800 text-sm flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">{isTe ? 'లోపం:' : 'Error:'}</strong>
                <p className="mt-0.5">{submitError}</p>
              </div>
            </div>
          )}

          {/* Back Button */}
          {step !== 'details' && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-xs hover:shadow-md transition-all text-gray-700 font-medium mb-6 border border-gray-200 cursor-pointer text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isTe ? 'వెనుకకు' : 'Back'}</span>
            </button>
          )}

          {/* Step 1: Citizen Personal Details Form */}
          {step === 'details' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                {/* Form Header */}
                <div className="bg-gradient-to-r from-[#67001A] to-[#800020] p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">
                        {isTe ? 'పౌర వ్యక్తిగత వివరాలు' : 'Citizen Personal Details'}
                      </h2>
                      <p className="text-xs text-amber-100 mt-1">
                        {isTe
                          ? 'పౌర ప్రొఫైల్ పూర్తి చేయడానికి దయచేసి మీ పూర్తి పేరు మరియు వివరాలను నమోదు చేయండి'
                          : 'Please provide your full name and details to complete citizen profile'}
                      </p>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-[#CCB252]/60 text-[#FEF08A] text-xs font-semibold">
                      {isTe ? 'పౌరుడు' : 'Citizen'}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleDetailsSubmit} className="p-6 sm:p-8 space-y-6">
                  {/* Officials guidance banner */}
                  <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
                    <div className="p-1 rounded-md bg-amber-200 text-amber-800 shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900">
                        {isTe
                          ? 'ఈ నమోదు కేవలం పౌరుల కోసం మాత్రమే.'
                          : 'This registration is strictly for Citizens.'}
                      </p>
                      <p className="text-amber-800 mt-0.5 leading-relaxed">
                        {isTe
                          ? 'మీరు సర్పంచ్, వార్డు సభ్యులు లేదా మండల అధికారినా? అధికారులు ప్రభుత్వ పరిశీలనతో నమోదు చేసుకోవాలి.'
                          : 'Are you a Sarpanch, Ward Member, or Mandal Official? Officials must register with government verification.'}
                      </p>
                      <Link
                        to="/register/official"
                        className="inline-block mt-1 font-bold text-[#67001A] hover:underline"
                      >
                        {isTe
                          ? 'అధికారుల నమోదు పోర్టల్‌కు వెళ్లండి →'
                          : 'Go to Officials Registration Portal →'}
                      </Link>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                      <User className="w-4 h-4 text-[#67001A]" />
                      {isTe ? 'పూర్తి పేరు' : 'Full Name'} <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isTe ? 'ఉదా. రమేష్ కుమార్' : 'e.g. Ramesh Kumar'}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#67001A] focus:outline-none transition-colors text-base"
                    />
                    {detailErrors.name && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{detailErrors.name}</p>
                    )}
                  </div>

                  {/* Father Name */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                      <Users className="w-4 h-4 text-[#67001A]" />
                      {isTe ? 'తండ్రి / సంరక్షకుని పేరు' : "Father's / Guardian's Name"} <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder={isTe ? 'ఉదా. వెంకటయ్య' : 'e.g. Venkataiah'}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#67001A] focus:outline-none transition-colors text-base"
                    />
                    {detailErrors.fatherName && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{detailErrors.fatherName}</p>
                    )}
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                      <Phone className="w-4 h-4 text-[#67001A]" />
                      {isTe ? 'మొబైల్ నంబర్' : 'Mobile Number'} <span className="text-red-600">*</span>
                    </label>
                    <div className="flex items-center">
                      <span className="px-3.5 py-3 bg-gray-100 border-2 border-r-0 border-gray-200 rounded-l-xl text-gray-600 font-semibold text-sm">
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                        placeholder={isTe ? '10 అంకెల మొబైల్ నంబర్' : '10-digit mobile number'}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-r-xl focus:border-[#67001A] focus:outline-none transition-colors text-base"
                      />
                    </div>
                    {detailErrors.phone ? (
                      <p className="text-xs text-red-600 mt-1 font-medium">{detailErrors.phone}</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        {isTe ? 'సమస్యల SMS నవీకరణలు & హెచ్చరికల కోసం ఉపయోగించబడుతుంది' : 'Used for issue updates and SMS alerts'}
                      </p>
                    )}
                  </div>

                  {/* Signed in Account Info */}
                  <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-3.5 text-xs text-gray-700">
                    <p>
                      <strong>{isTe ? 'లాగిన్ అయిన ఖాతా:' : 'Signed in as:'}</strong>{' '}
                      <span className="font-mono text-gray-900 font-bold">
                        {user?.email ?? (user?.phone ? `+91 ${user.phone.replace(/^\+91/, '')}` : (isTe ? 'పౌర ఖాతా' : 'Citizen Account'))}
                      </span>
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#67001A] to-[#800020] hover:from-[#520015] hover:to-[#67001A] text-white py-3.5 px-6 rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    {isTe ? 'జిల్లా ఎంపికకు కొనసాగండి →' : 'Continue to District Selection →'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Step 2: District Selection */}
          {step === 'district' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isTe ? 'మీ జిల్లాను ఎంచుకోండి' : 'Select Your District'}
                  </h2>
                  <p className="text-xs text-gray-600 mt-1">
                    {isTe
                      ? `తెలంగాణలోని ${telanganaData.length} జిల్లాలలో మీ జిల్లాను ఎంచుకోండి`
                      : `Choose your home district from ${telanganaData.length} districts in Telangana`}
                  </p>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={isTe ? 'జిల్లాను వెతకండి...' : 'Search district...'}
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#67001A]"
                  />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {filteredDistricts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-xs">
                  <p className="text-gray-500 font-medium">
                    {isTe ? `"${searchFilter}"తో ఏ జిల్లా కనుగొనబడలేదు` : `No districts found matching "${searchFilter}"`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredDistricts.map((district) => {
                    const placeImg = getPlaceImage('district', district.name);
                    const imgSrc = placeImg?.imageUrl || '/default-district.jpg';

                    return (
                      <div
                        key={district.name}
                        onClick={() => handleDistrictSelect(district)}
                        className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 aspect-[4/3] flex flex-col justify-end border border-slate-200"
                      >
                        {/* Background District Image */}
                        <img
                          src={imgSrc}
                          alt={placeImg?.caption || district.name}
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.endsWith('/default-district.jpg')) {
                              target.src = '/default-district.jpg';
                            }
                          }}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Layer 1: Tint */}
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors duration-300" />

                        {/* Layer 2: Gradient for Legibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent group-hover:from-black/80 transition-all duration-300" />

                        {/* Content */}
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
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-bold border border-white/15">
                              <MapPin className="w-3.5 h-3.5 text-[#CCB252]" />
                              {district.mandals.length} {isTe ? 'మండలాలు' : 'Mandals'}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#CCB252]/20 backdrop-blur-sm text-[#FEF08A] text-[11px] font-semibold border border-[#CCB252]/30">
                              {isTe ? 'ఎంచుకోండి →' : 'Select →'}
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

          {/* Step 3: Mandal Selection */}
          {step === 'mandal' && selectedDistrict && (
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-3 font-medium">
                <span>{isTe ? 'తెలంగాణ' : 'Telangana'}</span>
                <span>/</span>
                <span className="text-[#67001A] font-bold">{selectedDistrict.name}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isTe ? 'మీ మండలాన్ని ఎంచుకోండి' : 'Select Your Mandal'}
                  </h2>
                  <p className="text-xs text-gray-600 mt-1">
                    {isTe
                      ? `${selectedDistrict.name} జిల్లాలోని మండలాలు`
                      : `Mandals under ${selectedDistrict.name} District`}
                  </p>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={isTe ? 'మండలాన్ని వెతకండి...' : 'Search mandal...'}
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#67001A]"
                  />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {filteredMandals.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-xs">
                  <p className="text-gray-500 font-medium">
                    {isTe ? `"${searchFilter}"తో ఏ మండలం కనుగొనబడలేదు` : `No mandals found matching "${searchFilter}"`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredMandals.map((mandal) => {
                    const placeImg = getPlaceImage('mandal', selectedDistrict.name, mandal.name);
                    const imgSrc = placeImg?.imageUrl || '/default-mandal.jpg';

                    return (
                      <div
                        key={mandal.name}
                        onClick={() => handleMandalSelect(mandal)}
                        className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 aspect-[4/3] flex flex-col justify-end border border-slate-200"
                      >
                        {/* Background Mandal Image */}
                        <img
                          src={imgSrc}
                          alt={placeImg?.caption || mandal.name}
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.endsWith('/default-mandal.jpg')) {
                              target.src = '/default-mandal.jpg';
                            }
                          }}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Layer 1: Tint */}
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors duration-300" />

                        {/* Layer 2: Gradient for Legibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent group-hover:from-black/80 transition-all duration-300" />

                        {/* Content */}
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
                            {mandal.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-bold border border-white/15">
                              <MapPin className="w-3.5 h-3.5 text-[#CCB252]" />
                              {mandal.villages.length} {isTe ? 'గ్రామాలు' : 'Villages'}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#CCB252]/20 backdrop-blur-sm text-[#FEF08A] text-[11px] font-semibold border border-[#CCB252]/30">
                              {isTe ? 'ఎంచుకోండి →' : 'Select →'}
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

          {/* Step 4: Village Selection */}
          {step === 'village' && selectedMandal && selectedDistrict && (
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-3 font-medium">
                <span>{isTe ? 'తెలంగాణ' : 'Telangana'}</span>
                <span>/</span>
                <span>{selectedDistrict.name}</span>
                <span>/</span>
                <span className="text-[#67001A] font-bold">{selectedMandal.name}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isTe ? 'మీ గ్రామాన్ని ఎంచుకోండి' : 'Select Your Home Village'}
                  </h2>
                  <p className="text-xs text-gray-600 mt-1">
                    {isTe
                      ? `${selectedMandal.name} మండలంలోని మీ గ్రామ పంచాయతీని ఎంచుకోండి`
                      : `Select your Gram Panchayat under ${selectedMandal.name} Mandal to complete profile`}
                  </p>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={isTe ? 'గ్రామాన్ని వెతకండి...' : 'Search village...'}
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#67001A]"
                  />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {filteredVillages.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-xs">
                  <p className="text-gray-500 font-medium">
                    {isTe ? `"${searchFilter}"తో ఏ గ్రామం కనుగొనబడలేదు` : `No villages found matching "${searchFilter}"`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredVillages.map((village) => {
                    const placeImg = getPlaceImage('village', selectedDistrict.name, selectedMandal.name, village.name);
                    const imgSrc = placeImg?.imageUrl || '/default-village.jpg';

                    return (
                      <button
                        key={village.name}
                        onClick={() => handleVillageSelect(village)}
                        disabled={isSubmitting}
                        className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 aspect-[4/3] flex flex-col justify-end border border-slate-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {/* Background Village Image */}
                        <img
                          src={imgSrc}
                          alt={placeImg?.caption || village.name}
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.endsWith('/default-village.jpg')) {
                              target.src = '/default-village.jpg';
                            }
                          }}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Layer 1: Tint */}
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors duration-300" />

                        {/* Layer 2: Gradient for Legibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent group-hover:from-black/80 transition-all duration-300" />

                        {/* Content */}
                        <div className="relative z-10 p-4 w-full">
                          {placeImg?.caption && (
                            <span className="inline-block text-[10px] font-bold text-[#CCB252] uppercase tracking-widest mb-1 drop-shadow-sm">
                              {placeImg.caption}
                            </span>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <h3
                              className="text-lg font-black text-white leading-tight tracking-tight truncate"
                              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                            >
                              {village.name}
                            </h3>
                            {isSubmitting && (
                              <Loader2 className="w-5 h-5 animate-spin text-[#FEF08A] shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {village.population && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-bold border border-white/15">
                                <Users className="w-3.5 h-3.5 text-[#FEF08A]" />
                                {isTe ? 'జనాభా: ' : 'Pop: '}
                                {village.population.toLocaleString('en-IN')}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#67001A]/85 backdrop-blur-sm text-[#FEF08A] text-xs font-bold border border-[#CCB252]/40">
                              {isTe ? 'ఎంచుకోండి & నమోదు చేయండి →' : 'Select & Confirm →'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
