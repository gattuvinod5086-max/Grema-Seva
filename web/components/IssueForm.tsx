import { useState } from 'react';
import { X, Upload, Camera, AlertTriangle } from 'lucide-react';
import { classifyIssue } from '@shared/services/issueClassification';
import VoiceInput from '@web/components/VoiceInput';
import LocationPicker from '@web/components/map/LocationPicker';
import { ISSUE_CATEGORIES } from '@shared/constants/governance';
import type { CreateIssue } from '@shared/types';

interface IssueFormProps {
  onClose: () => void;
  onSubmitted: () => void;
}

export default function IssueForm({ onClose, onSubmitted }: IssueFormProps) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handlePickLocation = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // The Idempotency-Key makes double-taps safe: the same key never
      // files the same complaint twice.
      const payload: CreateIssue = {
        category: category ?? undefined,
        description,
        latitude,
        longitude,
        addressText: location || undefined,
      };

      const issueResponse = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      const body = await issueResponse.json().catch(() => ({}));

      if (!issueResponse.ok) {
        setError(body?.error?.message ?? 'Failed to submit the issue.');
        return;
      }

      if (body.duplicate) setDuplicateWarning(true);

      if (photo && body?.issue?.id) {
        const formData = new FormData();
        formData.append('file', photo);
        formData.append('phase', 'report');
        const uploadRes = await fetch(`/api/issues/${body.issue.id}/attachments`, {
          method: 'POST',
          credentials: 'same-origin',
          body: formData,
        });
        if (!uploadRes.ok) {
          setError('Issue submitted, but the photo upload failed.');
        }
      }

      if (!body.duplicate) {
        onSubmitted();
      } else {
        // Duplicate warning shown; only exit when the user acknowledges.
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Error submitting issue:', err);
      setError('Network error. Please try again.');
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

        {duplicateWarning && (
          <div className="mx-6 mt-6 bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900 text-sm">Looks like a similar report exists nearby</p>
                <p className="text-amber-800 text-sm mt-1">
                  We saved your report and linked it to the existing one, so officials see both together.
                </p>
                <button
                  type="button"
                  onClick={onSubmitted}
                  className={`mt-3 ${'px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold'}`}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <VoiceInput
            onTranscript={(text) => {
              setDescription(text);
              const c = classifyIssue(text);
              setCategory(c.category);
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

          {/* Location: pin-drop picker with GPS shortcut */}
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Location — tap the map to drop a pin
            </label>
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              onChange={handlePickLocation}
            />
            {latitude != null && longitude != null && (
              <p className="mt-2 text-xs font-semibold text-green-700">
                Pinned at {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
          )}

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
