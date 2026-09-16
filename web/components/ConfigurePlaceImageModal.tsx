import { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  MapPin,
  Building2,
  Sparkles,
} from 'lucide-react';
import { normalizeImageUrl, isGoogleDriveUrl, isValidImageUrl } from '@shared/utils/imageUrl';
import type { PlaceLevel, PlaceImageRecord } from '@shared/types';

interface ConfigurePlaceImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  place: {
    level: PlaceLevel;
    district: string;
    mandal?: string;
    village?: string;
  };
  currentRecord?: PlaceImageRecord | null;
  onSaved: (record: PlaceImageRecord | null) => void;
}

export default function ConfigurePlaceImageModal({
  isOpen,
  onClose,
  place,
  currentRecord,
  onSaved,
}: ConfigurePlaceImageModalProps) {
  const [tab, setTab] = useState<'url' | 'upload'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initialUrl = currentRecord?.imageUrl ?? '';
      setUrlInput(initialUrl);
      setPreviewUrl(initialUrl);
      setCaption(currentRecord?.caption ?? '');
      setPreviewStatus(initialUrl ? 'loading' : 'idle');
      setErrorMessage(null);
      setTab('url');
    }
  }, [isOpen, currentRecord]);

  if (!isOpen) return null;

  const placeDisplayName =
    place.level === 'village'
      ? `${place.village} (${place.mandal} Mandal, ${place.district})`
      : place.level === 'mandal'
      ? `${place.mandal} Mandal (${place.district})`
      : `${place.district} District`;

  const isGDrive = isGoogleDriveUrl(urlInput);

  const handleUrlChange = (val: string) => {
    setUrlInput(val);
    setErrorMessage(null);
    if (!val.trim()) {
      setPreviewUrl('');
      setPreviewStatus('idle');
      return;
    }
    const normalized = normalizeImageUrl(val);
    setPreviewUrl(normalized);
    setPreviewStatus('loading');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image file is too large (maximum size is 10 MB).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/places/upload', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) {
        setErrorMessage(body?.error?.message ?? 'Failed to upload image. Please try again.');
        return;
      }

      setUrlInput(body.url);
      setPreviewUrl(body.url);
      setPreviewStatus('loading');
      setTab('url');
    } catch {
      setErrorMessage('Network error while uploading image.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = previewUrl.trim() || normalizeImageUrl(urlInput);

    if (!finalUrl) {
      setErrorMessage('Please provide an image link or upload a file.');
      return;
    }

    if (!isValidImageUrl(finalUrl)) {
      setErrorMessage('Please enter a valid HTTP/HTTPS image URL or upload an image.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/places/image', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          level: place.level,
          district: place.district,
          mandal: place.mandal,
          village: place.village,
          imageUrl: finalUrl,
          caption: caption.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setErrorMessage(data?.error?.message ?? 'Failed to save place image.');
        return;
      }

      onSaved(data.placeImage);
      onClose();
    } catch {
      setErrorMessage('Network error while saving place image.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentRecord && !urlInput) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/places/image', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          level: place.level,
          district: place.district,
          mandal: place.mandal,
          village: place.village,
          imageUrl: '',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(data?.error?.message ?? 'Failed to remove image.');
        return;
      }

      onSaved(null);
      onClose();
    } catch {
      setErrorMessage('Network error while removing image.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/70 via-white to-orange-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#67001A] text-[#CCB252] flex items-center justify-center shadow-xs">
              {place.level === 'district' ? (
                <Building2 size={20} />
              ) : (
                <MapPin size={20} />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-snug">
                Configure Place Landmark Image
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {placeDisplayName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher: URL / Upload */}
        <div className="px-5 pt-3 border-b border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'url'
                ? 'border-[#67001A] text-[#67001A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LinkIcon size={14} /> Image Link (Any URL / Drive)
          </button>
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'upload'
                ? 'border-[#67001A] text-[#67001A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload size={14} /> Upload Image File
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {tab === 'url' ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Image Link (Any Web URL or Google Drive Link)
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Paste any image URL (e.g. Wikimedia, Unsplash, government portal, or Google Drive link)"
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-[#67001A] outline-none transition-colors"
                autoFocus
              />
              <p className="text-[11px] text-slate-500">
                You can paste <strong>any public web image link</strong> (Wikimedia Commons, Unsplash, CDN, or direct <code>.jpg</code> / <code>.png</code> / <code>.webp</code> link) or a Google Drive share link.
              </p>

              {isGDrive && (
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2">
                  <Sparkles size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Google Drive Link Detected:</strong>
                    <p className="text-[11px] text-indigo-700 mt-0.5">
                      Automatically converting to Google’s direct CDN image endpoint. Make sure the file’s sharing permission in Drive is set to <strong>&ldquo;Anyone with the link can view&rdquo;</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Upload Image File (JPEG, PNG, WebP)
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-[#67001A]/50 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isSubmitting}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                  <Upload size={28} className="text-[#67001A]" />
                  <p className="text-xs font-bold text-slate-700">Click to choose image file</p>
                  <p className="text-[11px] text-slate-400">Max size 10 MB</p>
                </div>
              </div>
            </div>
          )}

          {/* Caption Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Landmark / Popular Identity Caption (Optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Charminar, Historic Aliabad Gateway, Ancient Temple"
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-[#67001A] outline-none transition-colors"
              maxLength={200}
            />
          </div>

          {/* Live Preview Section */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Live Image Preview</span>
              {previewStatus === 'loaded' && (
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Ready to display
                </span>
              )}
              {previewStatus === 'error' && (
                <span className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle size={13} /> Load failed
                </span>
              )}
            </label>

            <div className="w-full h-44 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative flex items-center justify-center">
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt={caption || placeDisplayName}
                    className={`w-full h-full object-cover transition-opacity duration-200 ${
                      previewStatus === 'loaded' ? 'opacity-100' : 'opacity-20'
                    }`}
                    onLoad={() => setPreviewStatus('loaded')}
                    onError={() => setPreviewStatus('error')}
                  />
                  {previewStatus === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                      <Loader2 size={24} className="animate-spin text-[#67001A]" />
                    </div>
                  )}
                  {previewStatus === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-red-50/90 text-center text-red-800">
                      <AlertCircle size={24} className="text-red-600 mb-1" />
                      <p className="text-xs font-bold">Image preview could not load</p>
                      <p className="text-[11px] text-red-600 mt-1 max-w-xs">
                        If this is a Google Drive link, verify that sharing is set to &ldquo;Anyone with the link can view&rdquo;.
                      </p>
                    </div>
                  )}
                  {previewStatus === 'loaded' && caption && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs text-white px-2.5 py-1 rounded-xl text-xs font-semibold truncate">
                      {caption}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-slate-400 p-4">
                  <ImageIcon size={32} className="mx-auto mb-1 opacity-40" />
                  <p className="text-xs font-medium">No image preview</p>
                  <p className="text-[11px] text-slate-400">Paste an image link or upload a file above</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            {currentRecord?.imageUrl ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-3.5 py-2.5 rounded-xl text-red-700 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Trash2 size={15} /> Remove Image
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !previewUrl}
                className="px-5 py-2.5 rounded-xl bg-[#67001A] text-white text-xs font-bold hover:opacity-95 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                Save Image
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
