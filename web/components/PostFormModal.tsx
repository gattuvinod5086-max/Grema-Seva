import { useState } from 'react';
import { X, Bell, Newspaper, AlertTriangle, Pin, CheckCircle2, Lock, Loader2, ImagePlus, Trash2 } from 'lucide-react';
import {
  POST_PRIORITIES,
  NOTICE_CATEGORIES,
  NEWS_CATEGORIES,
  type PostType,
  type PostPriority,
  type User,
} from '@shared/types';

interface PostFormModalProps {
  onClose: () => void;
  onCreated: () => void;
  user: User;
  defaultType?: PostType;
}

export default function PostFormModal({
  onClose,
  onCreated,
  user,
  defaultType = 'news',
}: PostFormModalProps) {
  const canPostNotice =
    user.role === 'super_admin' ||
    user.role === 'admin' ||
    (['sarpanch', 'ward_member'].includes(user.role) && user.approvalStatus === 'approved');

  const [type, setType] = useState<PostType>(canPostNotice ? defaultType : 'news');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>(
    type === 'notice' ? NOTICE_CATEGORIES[0] : NEWS_CATEGORIES[0]
  );
  const [priority, setPriority] = useState<PostPriority>('NORMAL');
  const [pinned, setPinned] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const wardNumber = user.wardNumber ?? '';
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypeChange = (newType: PostType) => {
    setType(newType);
    setCategory(newType === 'notice' ? NOTICE_CATEGORIES[0] : NEWS_CATEGORIES[0]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file must be under 10 MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let uploadedImageUrl: string | undefined = undefined;

      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);

        const uploadRes = await fetch('/api/posts/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        const uploadBody = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          setError(uploadBody?.error?.message ?? 'Failed to upload attached image');
          setSubmitting(false);
          return;
        }

        uploadedImageUrl = uploadBody.url;
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type,
          title: title.trim(),
          content: content.trim(),
          category,
          priority,
          pinned,
          imageUrl: uploadedImageUrl,
          wardNumber: wardNumber.trim() || undefined,
          district: user.district ?? undefined,
          mandal: user.mandal ?? undefined,
          village: user.village ?? undefined,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error?.message ?? 'Failed to publish post');
        return;
      }

      onCreated();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#67001A] to-[#8A1538] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {type === 'notice' ? (
              <Bell className="w-6 h-6 text-[#CCB252]" />
            ) : (
              <Newspaper className="w-6 h-6 text-[#CCB252]" />
            )}
            <div>
              <h2 className="text-lg font-bold">
                {type === 'notice' ? 'Publish Official Public Notice' : 'Share Community News'}
              </h2>
              <p className="text-xs text-white/80">
                {type === 'notice'
                  ? `Targeted to ${user.village ? `${user.village} Village` : 'Public Governance'}`
                  : 'Public community updates for villagers & citizens'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Post Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('news')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  type === 'news'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Newspaper className="w-4 h-4" />
                <span>Community News</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-800">
                  Open
                </span>
              </button>

              <button
                type="button"
                onClick={() => canPostNotice && handleTypeChange('notice')}
                disabled={!canPostNotice}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  type === 'notice'
                    ? 'bg-[#67001A] text-white border-[#520015] shadow-xs'
                    : canPostNotice
                    ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
                title={!canPostNotice ? 'Only approved officials can publish official notices' : ''}
              >
                {canPostNotice ? <Bell className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>Official Notice</span>
                {!canPostNotice && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-600">
                    Officials only
                  </span>
                )}
              </button>
            </div>
            {!canPostNotice && (
              <p className="text-[11px] text-slate-500 mt-1">
                Notice publishing is reserved for Gram Panchayat officials (Sarpanch, Ward Members, Admins) for official announcements.
              </p>
            )}
          </div>

          {/* Location Scope Banner */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <span className="font-bold text-slate-800">Associated Location: </span>
            {user.village ? (
              <span>
                {user.village}, {user.mandal}, {user.district} District
              </span>
            ) : (
              <span>Telangana Statewide ({user.role.replace('_', ' ')})</span>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              {type === 'notice' ? 'Notice Subject / Title' : 'Headline / News Title'} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'notice'
                  ? 'e.g. Gram Sabha Meeting on Friday 10:00 AM'
                  : 'e.g. Village Youth Win District Sports Championship'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#67001A]/30 focus:border-[#67001A]"
              maxLength={200}
              required
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-hidden focus:ring-2 focus:ring-[#67001A]/30"
              >
                {(type === 'notice' ? NOTICE_CATEGORIES : NEWS_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PostPriority)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-hidden focus:ring-2 focus:ring-[#67001A]/30"
              >
                {POST_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p === 'URGENT' ? '🚨 URGENT' : p === 'IMPORTANT' ? '⚠️ IMPORTANT' : 'NORMAL'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              {type === 'notice' ? 'Notice Details & Instructions (Optional)' : 'News Content (Optional)'}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                type === 'notice'
                  ? 'Enter optional notice instructions, dates, timings, or leave blank if attached circular image has details...'
                  : 'Write optional community news details...'
              }
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#67001A]/30 focus:border-[#67001A]"
              maxLength={5000}
            />
          </div>

          {/* Attach Image / Document */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              {type === 'notice'
                ? 'Attach Document Photo / Official Circular (Optional)'
                : 'Attach Photo (Optional)'}
            </label>

            {imagePreview ? (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                  <div className="text-xs truncate">
                    <p className="font-semibold text-slate-800 truncate">{imageFile?.name}</p>
                    <p className="text-slate-400">
                      {imageFile ? `${(imageFile.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                  title="Remove Image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  id="post-image-file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <label
                  htmlFor="post-image-file"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 border border-dashed border-slate-300 rounded-xl hover:border-[#67001A] hover:bg-rose-50/20 text-slate-600 hover:text-[#67001A] transition-all cursor-pointer text-xs font-semibold"
                >
                  <ImagePlus className="w-4 h-4 text-slate-500" />
                  <span>
                    {type === 'notice'
                      ? 'Upload Official Notice / Order Document Image (JPG, PNG, WebP up to 10MB)'
                      : 'Upload Image (JPG, PNG, WebP up to 10MB)'}
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Pin option for officials */}
          {canPostNotice && type === 'notice' && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 rounded-sm text-[#67001A] border-slate-300 focus:ring-[#67001A]"
              />
              <Pin className="w-3.5 h-3.5 text-[#CCB252]" />
              <span>Pin this notice to the top of the village feed</span>
            </label>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#67001A] text-white text-xs font-bold hover:bg-[#520015] disabled:opacity-50 flex items-center gap-2 shadow-xs transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{type === 'notice' ? 'Publish Notice' : 'Post News'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
