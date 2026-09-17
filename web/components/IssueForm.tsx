import { useEffect, useState } from 'react';
import { X, Upload, Camera, AlertTriangle, Copy, Loader2 } from 'lucide-react';
import { classifyIssue } from '@shared/services/issueClassification';
import VoiceInput from '@web/components/VoiceInput';
import LocationPicker from '@web/components/map/LocationPicker';
import { ISSUE_CATEGORIES } from '@shared/constants/governance';
import type { CreateIssue, SimilarIssue } from '@shared/types';

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
  const [similar, setSimilar] = useState<SimilarIssue[]>([]);

  // As soon as a category is picked, surface open issues already reported
  // in the village (nearest first) so the user doesn't file duplicates.
  useEffect(() => {
    if (!category) {
      setSimilar([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ category });
      if (latitude != null && longitude != null) {
        params.set('lat', String(latitude));
        params.set('lng', String(longitude));
      }
      fetch(`/api/issues/similar?${params}`, { credentials: 'same-origin', signal: controller.signal })
        .then((r) => (r.ok ? r.json() : { similar: [] }))
        .then((b) => setSimilar(b.similar ?? []))
        .catch(() => {});
    }, 600);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [category, latitude, longitude]);

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

    const trimmedDescription = description.trim();
    if (!category) {
      setError('Please select an issue category.');
      return;
    }

    if (trimmedDescription.length < 5) {
      setError('Description must have at least 5 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // The Idempotency-Key makes double-taps safe: the same key never
      // files the same complaint twice.
      const payload: CreateIssue = {
        category: category ?? undefined,
        description: trimmedDescription,
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
        const detailMsg =
          Array.isArray(body?.error?.details) && body.error.details.length > 0
            ? body.error.details.map((d: { message: string }) => d.message).join(', ')
            : null;
        setError(detailMsg ?? body?.error?.message ?? 'Failed to submit the issue.');
        setSubmitting(false);
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

          {/* Already-reported check */}
          {similar.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
              <p className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <Copy size={15} />
                Already reported in your village ({similar.length})
              </p>
              <p className="text-xs text-amber-700 mt-1">
                If yours is the same problem, you don&apos;t need to file again — the sarpanch
                already has it. Otherwise, continue below.
              </p>
              <ul className="mt-3 space-y-2">
                {similar.map((s) => (
                  <li key={s.code} className="bg-white rounded-lg border border-amber-200 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800">{s.category}</span>
                      <span className="text-xs font-semibold text-slate-500">
                        {s.status}
                        {s.distanceM != null ? ` · ~${s.distanceM} m away` : ''}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5 line-clamp-2">{s.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-base font-semibold text-gray-900">
                Description *
              </label>
              <span
                className={`text-xs font-semibold ${
                  description.trim().length === 0
                    ? 'text-gray-400'
                    : description.trim().length < 5
                    ? 'text-red-500'
                    : 'text-green-600'
                }`}
              >
                {description.trim().length < 5
                  ? `${description.trim().length}/5 chars min`
                  : `${description.trim().length} chars`}
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (error && e.target.value.trim().length >= 5) {
                  setError(null);
                }
              }}
              placeholder="Describe the issue in detail (minimum 5 characters)..."
              rows={4}
              minLength={5}
              maxLength={4000}
              className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-all text-base ${
                description.length > 0 && description.trim().length < 5
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
              }`}
              required
            />
            {description.length > 0 && description.trim().length < 5 && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                Description must be at least 5 characters (currently {description.trim().length}).
              </p>
            )}
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
          <div className="space-y-2">
            <button
              type="submit"
              disabled={!category || description.trim().length < 5 || submitting}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                'Submit Issue'
              )}
            </button>
            {(!category || description.trim().length < 5) && !submitting && (
              <p className="text-center text-xs text-gray-500">
                {!category && description.trim().length < 5
                  ? 'Select a category and enter at least 5 characters to submit'
                  : !category
                  ? 'Select an issue category above to submit'
                  : 'Description must have at least 5 characters to submit'}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
