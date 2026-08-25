import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { ArrowLeft, MapPin, CheckCircle, User, Phone, Users } from 'lucide-react';
import { telanganaData, type District, type Mandal, type Village } from '@/data/telangana';

type Step = 'details' | 'district' | 'mandal' | 'village';

export default function Registration() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('details');
  
  // User details
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  
  // Location selection
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedMandal, setSelectedMandal] = useState<Mandal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim() && fatherName.trim() && mobileNumber.trim()) {
      setStep('district');
    }
  };

  const handleDistrictSelect = (district: District) => {
    setSelectedDistrict(district);
    setSelectedMandal(null);
    setStep('mandal');
  };

  const handleMandalSelect = (mandal: Mandal) => {
    setSelectedMandal(mandal);
    setStep('village');
  };

  const handleVillageSelect = async (village: Village) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users/me/complete-registration', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          father_name: fatherName,
          phone: mobileNumber,
          district: selectedDistrict!.name,
          mandal: selectedMandal!.name,
          village: village.name,
        }),
      });

      if (response.ok) {
        navigate('/', { replace: true });
      } else {
        alert('Failed to complete registration. Please try again.');
        setIsSubmitting(false);
      }
    } catch {
      alert('Failed to complete registration. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
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

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Step 1: Details */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'mandal' ? 'bg-orange-500 text-white' : 
                getStepNumber() > 3 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {getStepNumber() > 3 ? <CheckCircle className="w-5 h-5" /> : '3'}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${
                step === 'mandal' ? 'text-orange-600' : getStepNumber() > 3 ? 'text-gray-900' : 'text-gray-500'
              }`}>
                Mandal
              </span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-200">
              <div className={`h-full transition-all duration-300 ${
                getStepNumber() > 3 ? 'bg-green-500 w-full' : 'bg-gray-200 w-0'
              }`} />
            </div>
            
            {/* Step 4: Village */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
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

        {/* User Details Form */}
        {step === 'details' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
            <form onSubmit={handleDetailsSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
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
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  Father's / Guardian's Name *
                </label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="Enter father's or guardian's name"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors text-lg"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="w-5 h-5 text-orange-500" />
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Enter your mobile number"
                  pattern="[0-9]{10}"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors text-lg"
                />
                <p className="text-sm text-gray-500 mt-1">Enter 10-digit mobile number</p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Email:</strong> {user?.email}
                </p>
                <p className="text-xs text-gray-500 mt-1">Your email is automatically verified via Google</p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Continue to Location Selection
              </button>
            </form>
          </div>
        )}

        {/* District Selection */}
        {step === 'district' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Your District</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {telanganaData.map((district) => (
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
          </div>
        )}

        {/* Mandal Selection */}
        {step === 'mandal' && selectedDistrict && (
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <span className="font-semibold text-gray-900">Telangana</span>
              <span>/</span>
              <span className="font-semibold text-gray-900">{selectedDistrict.name}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Your Mandal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDistrict.mandals.map((mandal) => (
                <button
                  key={mandal.name}
                  onClick={() => handleMandalSelect(mandal)}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 p-6 text-left group"
                >
                  <MapPin className="w-8 h-8 text-pink-500 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-pink-600 transition-colors">
                    {mandal.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {mandal.villages.length} Villages
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Village Selection */}
        {step === 'village' && selectedMandal && selectedDistrict && (
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <span className="font-semibold text-gray-900">Telangana</span>
              <span>/</span>
              <span className="font-semibold text-gray-900">{selectedDistrict.name}</span>
              <span>/</span>
              <span className="font-semibold text-gray-900">{selectedMandal.name}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Your Village</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedMandal.villages.map((village) => (
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
          </div>
        )}
      </div>
    </div>
  );
}
