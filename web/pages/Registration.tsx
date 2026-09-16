import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, MapPin, CheckCircle, User, Phone, Users, Loader2, Search, X, Building2, Crown, ShieldCheck } from 'lucide-react';
import { telanganaData, type District, type Mandal, type Village } from '@shared/data/telangana';
import type { User as ApiUser } from '@shared/types';
import {
  isValidIndianMobile,
  personNameSchema,
  MOBILE_ERROR,
  NAME_ERROR,
} from '@shared/validation';

type Step = 'details' | 'district' | 'mandal' | 'village';
type RegistrationRole = 'citizen' | 'mandal_official' | 'sarpanch' | 'ward_member';

const ROLE_OPTIONS: { role: RegistrationRole; title: string; subtitle: string; icon: React.ReactNode }[] = [
  {
    role: 'citizen',
    title: 'Citizen',
    subtitle: 'Select district, mandal, and your home village to report and track issues.',
    icon: <User className="w-5 h-5 text-orange-600" />,
  },
  {
    role: 'mandal_official',
    title: 'Mandal Official',
    subtitle: 'Select district and mandal only. Auto-assigned jurisdiction covering all villages.',
    icon: <Building2 className="w-5 h-5 text-indigo-600" />,
  },
  {
    role: 'sarpanch',
    title: 'Sarpanch (Panchayat Head)',
    subtitle: 'Select your Gram Panchayat village to govern and resolve issues.',
    icon: <Crown className="w-5 h-5 text-amber-600" />,
  },
  {
    role: 'ward_member',
    title: 'Ward Member',
    subtitle: 'Select your village and specify your designated ward number.',
    icon: <Users className="w-5 h-5 text-purple-600" />,
  },
];

export default function Registration() {
  const navigate = useNavigate();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [step, setStep] = useState<Step>('details');

  // Role selection
  const [selectedRole, setSelectedRole] = useState<RegistrationRole>('citizen');
  const [wardNumber, setWardNumber] = useState('');

  // User details
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // Location selection & search
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedMandal, setSelectedMandal] = useState<Mandal | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingMandalName, setSubmittingMandalName] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [detailErrors, setDetailErrors] = useState<{ name?: string; fatherName?: string; phone?: string; wardNumber?: string }>({});

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
          if (u.phone) setMobileNumber(u.phone.replace(/^\+91/, ''));
          if (u.wardNumber) setWardNumber(u.wardNumber);
          if (u.role === 'mandal_official' || u.role === 'sarpanch' || u.role === 'ward_member') {
            setSelectedRole(u.role);
          }
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  const isMandalOfficial = selectedRole === 'mandal_official';

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof detailErrors = {};

    if (!personNameSchema.safeParse(fullName).success) errors.name = NAME_ERROR;
    if (!personNameSchema.safeParse(fatherName).success) errors.fatherName = NAME_ERROR;
    if (!isValidIndianMobile(mobileNumber)) errors.phone = MOBILE_ERROR;
    if (selectedRole === 'ward_member' && !wardNumber.trim()) {
      errors.wardNumber = 'Please specify your ward number (e.g. 1, 2, 3...)';
    }

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

  const handleMandalSelect = async (mandal: Mandal) => {
    setSelectedMandal(mandal);

    // If Mandal Official: Never ask for village! Submit immediately with District + Mandal.
    if (isMandalOfficial) {
      setIsSubmitting(true);
      setSubmittingMandalName(mandal.name);
      setSubmitError(null);

      try {
        const response = await fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            name: fullName,
            fatherName: fatherName,
            phone: mobileNumber,
            role: selectedRole,
            district: selectedDistrict!.name,
            mandal: mandal.name,
          }),
        });
        const body = await response.json().catch(() => ({}));

        if (response.ok) {
          navigate('/', { replace: true });
        } else {
          setSubmitError(body?.error?.message ?? 'Failed to complete mandal registration. Please try again.');
          setIsSubmitting(false);
          setSubmittingMandalName(null);
        }
      } catch {
        setSubmitError('Network error. Please try again.');
        setIsSubmitting(false);
        setSubmittingMandalName(null);
      }
      return;
    }

    // For other roles (citizen, sarpanch, ward_member): proceed to village selection.
    setSearchFilter('');
    setStep('village');
  };

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

  const handleVillageSelect = async (village: Village) => {
    setIsSubmitting(true);
    setSubmitError(null);

    const payload: Record<string, any> = {
      name: fullName,
      fatherName: fatherName,
      phone: mobileNumber,
      role: selectedRole,
      district: selectedDistrict!.name,
      mandal: selectedMandal!.name,
      village: village.name,
    };

    if (selectedRole === 'ward_member') {
      payload.wardNumber = wardNumber.trim();
    }

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
        setSubmitError(body?.error?.message ?? 'Failed to complete registration. Please try again.');
        setIsSubmitting(false);
      }
    } catch {
      setSubmitError('Network error. Please try again.');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Welcome to GramSeva!</h1>
          <p className="text-gray-600">Please complete your registration to get started</p>
        </div>
      </div>

      {/* Role-Adaptive Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Step 1: Details */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step === 'details' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
              }`}>
                {step === 'details' ? '1' : <CheckCircle className="w-5 h-5" />}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${
                step === 'details' ? 'text-orange-600' : 'text-gray-900'
              }`}>
                Details
              </span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-200">
              <div className={`h-full transition-all duration-300 ${
                getStepNumber() > 1 ? 'bg-green-500 w-full' : 'bg-gray-200 w-0'
              }`} />
            </div>

            {/* Step 2: District */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step === 'district' ? 'bg-orange-500 text-white' :
                getStepNumber() > 2 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {getStepNumber() > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${
                step === 'district' ? 'text-orange-600' : getStepNumber() > 2 ? 'text-gray-900' : 'text-gray-500'
              }`}>
                District
              </span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-200">
              <div className={`h-full transition-all duration-300 ${
                getStepNumber() > 2 ? 'bg-green-500 w-full' : 'bg-gray-200 w-0'
              }`} />
            </div>

            {/* Step 3: Mandal */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step === 'mandal' ? 'bg-orange-500 text-white' :
                getStepNumber() > 3 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {getStepNumber() > 3 ? <CheckCircle className="w-5 h-5" /> : '3'}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${
                step === 'mandal' ? 'text-orange-600' : getStepNumber() > 3 ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {isMandalOfficial ? 'Mandal Jurisdiction' : 'Mandal'}
              </span>
            </div>

            {/* Step 4: Village (Only for Citizen, Sarpanch, Ward Member. Never for Mandal Official!) */}
            {!isMandalOfficial && (
              <>
                <div className="flex-1 h-1 mx-2 bg-gray-200">
                  <div className={`h-full transition-all duration-300 ${
                    getStepNumber() > 3 ? 'bg-green-500 w-full' : 'bg-gray-200 w-0'
                  }`} />
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    step === 'village' ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    4
                  </div>
                  <span className={`text-sm font-medium hidden sm:inline ${
                    step === 'village' ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    Village
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {submitError && (
          <div className="max-w-2xl mx-auto mb-4 bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {submitError}
          </div>
        )}

        {/* Back Button */}
        {step !== 'details' && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all text-gray-700 font-medium mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        )}

        {/* User Details & Role Form */}
        {step === 'details' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information &amp; Role</h2>
            <form onSubmit={handleDetailsSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">

              {/* Role Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Your Role / Designation *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ROLE_OPTIONS.map((opt) => {
                    const isSelected = selectedRole === opt.role;
                    return (
                      <button
                        key={opt.role}
                        type="button"
                        onClick={() => setSelectedRole(opt.role)}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/60 shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {opt.icon}
                          <span className={`text-sm font-bold ${isSelected ? 'text-orange-950' : 'text-gray-900'}`}>
                            {opt.title}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-snug">
                          {opt.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mandal Official Informational Note */}
              {isMandalOfficial && (
                <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2.5">
                  <Building2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Mandal Jurisdiction Level:</strong>
                    <p className="text-indigo-800 mt-0.5">
                      You will select your District and Mandal. You will manage all villages under that mandal automatically without having to choose an individual village.
                    </p>
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-5 h-5 text-orange-500" />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors text-lg"
                />
                {detailErrors.name && (
                  <p className="text-sm text-red-600 mt-1">{detailErrors.name}</p>
                )}
              </div>

              {/* Father Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  Father&apos;s / Guardian&apos;s Name *
                </label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="Enter father's or guardian's name"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors text-lg"
                />
                {detailErrors.fatherName && (
                  <p className="text-sm text-red-600 mt-1">{detailErrors.fatherName}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="w-5 h-5 text-orange-500" />
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                  placeholder="Enter your mobile number"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors text-lg"
                />
                {detailErrors.phone ? (
                  <p className="text-sm text-red-600 mt-1">{detailErrors.phone}</p>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">Enter 10-digit Indian mobile number</p>
                )}
              </div>

              {/* Ward Member field */}
              {selectedRole === 'ward_member' && (
                <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
                  <label className="flex items-center gap-2 text-sm font-semibold text-purple-900 mb-2">
                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                    Ward Number *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={wardNumber}
                    onChange={(e) => setWardNumber(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="e.g. 1, 2, 3..."
                    required
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-lg bg-white"
                  />
                  {detailErrors.wardNumber && (
                    <p className="text-sm text-red-600 mt-1">{detailErrors.wardNumber}</p>
                  )}
                  <p className="text-xs text-purple-700 mt-1">
                    Your account will be strictly isolated to manage issues for this ward number.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Signed in as:</strong> {user?.email ?? (user?.phone ? `+91 ${user.phone.replace(/^\+91/, '')}` : 'your account')}
                </p>
                {user?.email && (
                  <p className="text-xs text-gray-500 mt-1">Your email is verified via Google</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isMandalOfficial ? 'Continue to Mandal Jurisdiction Selection' : 'Continue to Location Selection'}
              </button>
            </form>
          </div>
        )}

        {/* District Selection */}
        {step === 'district' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isMandalOfficial ? 'Select Your District (Mandal Jurisdiction)' : 'Select Your District'}
                </h2>
                <p className="text-sm text-gray-500">Pick the district in Telangana</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search district..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {filteredDistricts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <p className="text-gray-500 font-medium">No districts found matching &ldquo;{searchFilter}&rdquo;</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDistricts.map((district) => (
                  <button
                    key={district.name}
                    onClick={() => handleDistrictSelect(district)}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 p-6 text-left group"
                  >
                    <MapPin className="w-8 h-8 text-orange-500 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                      {district.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {district.mandals.length} Mandals
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mandal Selection */}
        {step === 'mandal' && selectedDistrict && (
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <span className="font-semibold text-gray-900">Telangana</span>
              <span>/</span>
              <span className="font-semibold text-orange-600">{selectedDistrict.name}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isMandalOfficial ? 'Select Your Mandal Jurisdiction' : 'Select Your Mandal'}
                </h2>
                <p className="text-sm text-gray-500">
                  {isMandalOfficial
                    ? `Selecting a mandal will assign your jurisdiction across all villages under it. No village selection needed.`
                    : `Mandals in ${selectedDistrict.name}`}
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search mandal..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500"
                />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {filteredMandals.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <p className="text-gray-500 font-medium">No mandals found matching &ldquo;{searchFilter}&rdquo;</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMandals.map((mandal) => {
                  const isThisSubmitting = isSubmitting && submittingMandalName === mandal.name;
                  return (
                    <button
                      key={mandal.name}
                      onClick={() => handleMandalSelect(mandal)}
                      disabled={isSubmitting}
                      className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 p-6 text-left group disabled:opacity-60 ${
                        isMandalOfficial ? 'border-2 border-indigo-100 hover:border-indigo-400' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <MapPin className={`w-8 h-8 ${isMandalOfficial ? 'text-indigo-600' : 'text-pink-500'} group-hover:scale-110 transition-transform`} />
                        {isThisSubmitting && (
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        )}
                      </div>
                      <h3 className={`text-xl font-bold text-gray-900 mb-1 ${isMandalOfficial ? 'group-hover:text-indigo-600' : 'group-hover:text-pink-600'} transition-colors`}>
                        {mandal.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {mandal.villages.length} Villages {isMandalOfficial ? '(Complete Mandal Scope)' : ''}
                      </p>
                      {isMandalOfficial && (
                        <p className="text-xs text-indigo-700 font-semibold mt-2">
                          Click to assign Mandal Jurisdiction →
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Village Selection (NEVER SHOWN FOR MANDAL OFFICIAL) */}
        {!isMandalOfficial && step === 'village' && selectedMandal && selectedDistrict && (
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <span className="font-semibold text-gray-900">Telangana</span>
              <span>/</span>
              <span className="font-semibold text-gray-900">{selectedDistrict.name}</span>
              <span>/</span>
              <span className="font-semibold text-purple-600">{selectedMandal.name}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Select Your Village</h2>
                <p className="text-sm text-gray-500">Villages under {selectedMandal.name} Mandal</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search village..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
                />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {filteredVillages.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <p className="text-gray-500 font-medium">No villages found matching &ldquo;{searchFilter}&rdquo;</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVillages.map((village) => (
                  <button
                    key={village.name}
                    onClick={() => handleVillageSelect(village)}
                    disabled={isSubmitting}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 p-5 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mb-3">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                      {village.name}
                    </h3>
                    {village.population && (
                      <p className="text-sm text-gray-600">
                        Pop: {village.population.toLocaleString('en-IN')}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
