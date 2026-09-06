import { ArrowLeft, Phone, MapPin, User, Crown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApi } from '@web/hooks/useApi';
import type { User as UserType } from '@shared/types';

export function WardMembers() {
  const navigate = useNavigate();
  const { data: user } = useApi<UserType>('/api/users/me');

  // Generate Sarpanch data for village
  const getSarpanch = (villageName: string, districtName: string) => {
    const villageHash = villageName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const firstNames = ['Venkatesh', 'Laxmi', 'Narasimha', 'Savitha', 'Balaji', 'Manjula', 'Srinivas', 'Padma', 'Krishna', 'Rekha'];
    const lastNames = ['Reddy', 'Rao', 'Naidu', 'Goud', 'Kumar', 'Prasad'];
    
    return {
      name: `${firstNames[villageHash % firstNames.length]} ${lastNames[villageHash % lastNames.length]}`,
      phone: `+91 ${9500000000 + villageHash}`,
      email: `sarpanch.${villageName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      village: villageName,
      district: districtName
    };
  };

  // Generate 15 ward members for village
  const getWardMembers = (villageName: string, districtName: string) => {
    const villageHash = villageName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const firstNames = [
      'Rajesh', 'Srinivas', 'Lakshmi', 'Padma', 'Kumar', 'Ramesh', 'Sunita',
      'Anitha', 'Venkat', 'Priya', 'Suresh', 'Kavitha', 'Ravi', 'Swathi', 'Mahesh',
      'Deepa', 'Kiran', 'Vijaya', 'Anil', 'Jyothi'
    ];
    const lastNames = ['Reddy', 'Rao', 'Naidu', 'Goud', 'Kumar', 'Prasad', 'Sharma', 'Patel'];
    
    return Array.from({ length: 15 }, (_, i) => ({
      id: `${villageName}-ward-${i + 1}`,
      name: `${firstNames[(villageHash + i) % firstNames.length]} ${lastNames[(villageHash + i) % lastNames.length]}`,
      wardNumber: i + 1,
      phone: `+91 ${9000000000 + (villageHash * 100) + i}`,
      village: villageName,
      district: districtName
    }));
  };

  const sarpanch = user?.village && user?.district ? getSarpanch(user.village, user.district) : null;
  const wardMembers = user?.village && user?.district ? getWardMembers(user.village, user.district) : [];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user.village || !user.district || !user.mandal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">📍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Location Not Set</h2>
          <p className="text-gray-600 mb-6">Please complete your registration to view Sarpanch and Ward Members for your village.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-pink-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

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
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
              Sarpanch & Ward Members
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-pink-600" />
              <span className="font-semibold">{user.village}, {user.mandal} - {user.district} District</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Sarpanch Card */}
        {sarpanch && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-8 h-8 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900">Village Sarpanch</h2>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-3xl shadow-2xl overflow-hidden border-4 border-purple-200">
              <div className="bg-white/10 backdrop-blur-sm px-8 py-5">
                <div className="flex items-center space-x-3">
                  <Crown className="w-8 h-8 text-yellow-300" />
                  <span className="text-white font-bold text-2xl">Sarpanch of {user.village}</span>
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
                      <p className="text-2xl font-bold text-gray-900">{sarpanch.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-4 rounded-xl">
                      <MapPin className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Village</p>
                      <p className="text-xl font-bold text-gray-900">{sarpanch.village}</p>
                      <p className="text-sm text-gray-600">{user.mandal}, {sarpanch.district} District</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 p-4 rounded-xl">
                      <Phone className="w-7 h-7 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Contact</p>
                      <a 
                        href={`tel:${sarpanch.phone}`}
                        className="text-xl font-bold text-blue-600 hover:text-blue-700"
                      >
                        {sarpanch.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-100 p-4 rounded-xl">
                      <User className="w-7 h-7 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                      <a 
                        href={`mailto:${sarpanch.email}`}
                        className="text-lg font-bold text-blue-600 hover:text-blue-700 break-all"
                      >
                        {sarpanch.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ward Members List */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Ward Members
          </h2>
          <p className="text-gray-600">{user.village} - 15 Ward Representatives</p>
        </div>
        
        <div className="space-y-6">
          {wardMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-3xl shadow-lg hover:shadow-2xl border-2 border-gray-100 hover:border-pink-300 overflow-hidden transition-all transform hover:scale-[1.01]"
            >
              <div className="bg-gradient-to-r from-pink-500 to-blue-500 px-8 py-5">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-2xl">Ward {member.wardNumber}</span>
                  <div className="bg-white px-6 py-2 rounded-full">
                    <span className="bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent font-bold text-sm">
                      WARD MEMBER
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-br from-pink-100 to-blue-100 p-4 rounded-xl">
                      <User className="w-7 h-7 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Name</p>
                      <p className="text-xl font-bold text-gray-900">{member.name}</p>
                    </div>
                  </div>

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

                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-4 rounded-xl">
                      <MapPin className="w-7 h-7 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Location</p>
                      <p className="text-lg font-bold text-gray-900">
                        {member.village}
                      </p>
                      <p className="text-sm text-gray-600">{user.mandal}, {user.district}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
