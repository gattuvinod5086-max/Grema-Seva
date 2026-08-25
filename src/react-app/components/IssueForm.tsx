import { useState } from 'react';
import { X, Upload, MapPin, Camera } from 'lucide-react';
import { classifyIssue } from '@/shared/services/issueClassification';
import VoiceInput from '@/react-app/components/VoiceInput';
import { ISSUE_CATEGORIES, ISSUE_PRIORITIES } from '@/shared/constants/governance';

interface IssueFormProps {
  onClose: () => void;
  onSubmit: () => void;
  initialCategory?: string;
  initialPriority?: string;
}

export default function IssueForm({
  onClose,
  onSubmit,
  initialCategory,
  initialPriority,
}: IssueFormProps) {
  const [category, setCategory] = useState(initialCategory ?? '');
  const [priority, setPriority] = useState(initialPriority ?? 'MEDIUM');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [capturedLocation, setCapturedLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const captureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          setLatitude(lat);
          setLongitude(lng);
          setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          setCapturedLocation(true);
        },
        () => {
          alert('Unable to get your location. Please enter it manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create the issue first
      const issueResponse = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category || undefined,
          description,
          priority,
          location: location || undefined,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
        }),
      });

      if (!issueResponse.ok) {
        throw new Error('Failed to create issue');
      }

      // If there's a photo, upload it
      if (photo) {
        // Get the issue ID from the list (last created)
        const issuesResponse = await fetch('/api/issues');
        const issues = await issuesResponse.json();
        const latestIssue = issues[0]; // Issues are sorted by created_at DESC

        const formData = new FormData();
        formData.append('photo', photo);

        await fetch(`/api/issues/${latestIssue.id}/photo`, {
          method: 'POST',
          body: formData,
        });
      }

      onSubmit();
    } catch (error) {
      console.error('Error submitting issue:', error);
      alert('Failed to submit issue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Report New Issue</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <VoiceInput
            onTranscript={(text) => {
              setDescription(text);
              const c = classifyIssue(text);
              setCategory(c.category);
              setPriority(c.priority);
            }}
          />

          {/* Category */}
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Issue Category *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ISSUE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-3 px-4 rounded-xl font-semibold text-base transition-all duration-200 ${
                    category === cat
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl"
            >
              {ISSUE_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-base"
              required
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Upload Photo
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="flex items-center justify-center gap-3 w-full py-4 px-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer"
              >
                {photo ? (
                  <>
                    <Camera className="w-6 h-6 text-green-600" />
                    <span className="text-gray-700 font-medium">{photo.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-gray-600">Take or upload a photo</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Location
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location or capture GPS"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-base"
              />
              <button
                type="button"
                onClick={captureLocation}
                className={`px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  capturedLocation
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <MapPin className="w-5 h-5" />
                <span className="hidden md:inline">GPS</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!category || !description || submitting}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {submitting ? 'Submitting...' : 'Submit Issue'}
          </button>
        </form>
      </div>
    </div>
  );
}
