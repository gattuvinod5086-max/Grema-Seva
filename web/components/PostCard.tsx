import { useState } from 'react';
import { Pin, MapPin, Calendar, Trash2, Bell, Newspaper, Maximize2, X } from 'lucide-react';
import { UserRoleBadge } from '@web/components/ui/UserRoleBadge';
import type { Post, User } from '@shared/types';

interface PostCardProps {
  post: Post;
  currentUser?: User | null;
  onDelete?: (id: string) => void;
  deletingId?: string | null;
}

export default function PostCard({ post, currentUser, onDelete, deletingId }: PostCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const isNotice = post.type === 'notice';
  const canDelete =
    Boolean(currentUser && (currentUser.id === post.authorId || currentUser.role === 'super_admin' || currentUser.role === 'admin'));

  const imageSrc = post.imageUrl
    ? post.imageUrl.startsWith('/') || post.imageUrl.startsWith('http')
      ? post.imageUrl
      : `/api/files/${post.imageUrl}`
    : null;

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        isNotice
          ? 'bg-gradient-to-b from-amber-50/40 via-white to-white border-amber-300/80 shadow-xs'
          : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
      }`}
    >
      {/* Top Banner for Notices */}
      {isNotice && (
        <div className="px-4 py-1.5 bg-[#67001A] text-white flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-[#CCB252]" />
            <span className="tracking-wide uppercase text-[11px]">Official Public Notice</span>
          </div>
          {post.pinned && (
            <span className="inline-flex items-center gap-1 text-[#CCB252] text-[10px] uppercase font-black">
              <Pin className="w-3 h-3" />
              <span>Pinned</span>
            </span>
          )}
        </div>
      )}

      <div className="p-5 space-y-3">
        {/* Meta badges row */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {!isNotice && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px]">
                <Newspaper className="w-3 h-3 text-slate-500" />
                <span>Community News</span>
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[11px]">
              {post.category}
            </span>
            {post.priority === 'URGENT' && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-bold text-[10px] uppercase">
                🚨 Urgent
              </span>
            )}
            {post.priority === 'IMPORTANT' && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px] uppercase">
                ⚠️ Important
              </span>
            )}
          </div>

          {canDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              disabled={deletingId === post.id}
              className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors"
              title="Delete post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
          {post.title}
        </h3>

        {/* Content */}
        {post.content ? (
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {post.content}
          </p>
        ) : null}

        {/* Attached Image / Document Photo */}
        {imageSrc && (
          <div className="pt-1">
            <div
              onClick={() => setPreviewOpen(true)}
              className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer group hover:border-slate-300 transition-all max-h-80 flex items-center justify-center"
            >
              <img
                src={imageSrc}
                alt={post.title}
                className="w-full max-h-80 object-contain rounded-2xl transition-transform duration-200 group-hover:scale-[1.01]"
                loading="lazy"
              />
              <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-3 h-3" />
                <span>View Fullscreen</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer info: Author, Location, Date */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-700">{post.authorName}</span>
            <UserRoleBadge role={post.authorRole} size="xs" />
          </div>

          <div className="flex items-center gap-3 flex-wrap text-slate-400">
            {post.village ? (
              <span className="inline-flex items-center gap-1 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-[#008A3B]" />
                <span>
                  {post.village}
                  {post.wardNumber ? ` · Ward ${post.wardNumber}` : ''}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Telangana Statewide</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(post.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {previewOpen && imageSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white rounded-full bg-black/40 hover:bg-black/60 transition-colors"
              title="Close image"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={imageSrc}
              alt={post.title}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
            />
            <p className="mt-2 text-xs text-white/80 text-center font-medium truncate max-w-lg">
              {post.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
