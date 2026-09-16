import { useState, useMemo } from 'react';
import { Bell, Newspaper, Plus, Loader2, MapPin } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useApi } from '@web/hooks/useApi';
import { useRealtimeEvent } from '@web/context/RealtimeContext';
import PostCard from '@web/components/PostCard';
import PostFormModal from '@web/components/PostFormModal';
import type { ListPostsResponse, User } from '@shared/types';

export default function NoticesAndNews() {
  const [searchParams] = useSearchParams();

  const { data: meData } = useApi<{ user: User }>('/api/users/me');
  const me = meData?.user ?? null;

  const [typeFilter, setTypeFilter] = useState<'all' | 'notice' | 'news'>('all');
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const isAdmin = me?.role === 'super_admin' || me?.role === 'admin';
  const isMandal = me?.role === 'mandal_official';
  const isVillageScoped = me?.role === 'citizen' || me?.role === 'sarpanch' || me?.role === 'ward_member';

  const district = isAdmin
    ? (searchParams.get('district') ?? me?.district ?? '')
    : (me?.district ?? '');
  const mandal = isAdmin
    ? (searchParams.get('mandal') ?? me?.mandal ?? '')
    : (me?.mandal ?? '');
  const village = isVillageScoped
    ? (me?.village ?? '')
    : isMandal
    ? (searchParams.get('village') ?? '')
    : (searchParams.get('village') ?? '');

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({ limit: '50' });
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (district) params.set('district', district);
    if (mandal) params.set('mandal', mandal);
    if (village) params.set('village', village);
    return `/api/posts?${params.toString()}`;
  }, [typeFilter, district, mandal, village]);

  const { data: postsData, isLoading: postsLoading, refetch } = useApi<ListPostsResponse>(apiUrl);
  const posts = postsData?.posts ?? [];

  // Listen for realtime notice & news changes and automatically refresh feed
  useRealtimeEvent(['notice', 'news', 'post'], () => {
    void refetch();
  });

  const canPostNotice =
    Boolean(me && (isAdmin || (['sarpanch', 'ward_member', 'mandal_official'].includes(me.role) && me.approvalStatus === 'approved')));

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to remove this post?')) return;
    setDeletingId(postId);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setNoticeMessage('Post removed successfully.');
        void refetch();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const noticesCount = useMemo(() => posts.filter((p) => p.type === 'notice').length, [posts]);
  const newsCount = useMemo(() => posts.filter((p) => p.type === 'news').length, [posts]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in">
      {/* Title & Action Banner */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
            Notices & Community News
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official village announcements and public community updates
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#67001A] text-white text-xs font-bold hover:bg-[#520015] shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{canPostNotice ? 'Publish Notice / News' : 'Share Community News'}</span>
        </button>
      </div>

      <div className="space-y-4">
        {noticeMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <span>{noticeMessage}</span>
            <button type="button" onClick={() => setNoticeMessage(null)} className="text-xs underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Location Identity Pill */}
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex-wrap text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <MapPin className="w-4 h-4 text-[#008A3B] shrink-0" />
            <span>
              <strong>Associated Location: </strong>
              {village
                ? `${village}, ${mandal}, ${district}`
                : mandal
                ? `${mandal} Mandal (${district})`
                : district
                ? `${district} District`
                : 'All Telangana Locations (Statewide)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-[#67001A]/10 text-[#67001A] font-bold text-[11px]">
              {noticesCount} Notices
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
              {newsCount} News
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Posts
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('notice')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'notice'
                  ? 'bg-[#67001A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-[#CCB252]" />
              <span>Official Notices</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('news')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'news'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>Community News</span>
            </button>
          </div>
        </div>

        {/* Posts List */}
        {postsLoading ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#67001A]" />
            <p className="text-xs mt-3">Loading notices and news…</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#67001A]/10 text-[#67001A] flex items-center justify-center mx-auto">
              {typeFilter === 'notice' ? (
                <Bell className="w-6 h-6" />
              ) : (
                <Newspaper className="w-6 h-6" />
              )}
            </div>
            <h3 className="font-bold text-slate-800 text-base">
              {typeFilter === 'notice'
                ? 'No official public notices found'
                : typeFilter === 'news'
                ? 'No community news published yet'
                : 'No announcements or news yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {typeFilter === 'notice'
                ? 'Official public notices from the Sarpanch and Panchayat will appear here for this location.'
                : 'Anyone can share community announcements, agriculture tips, youth sports, and local events.'}
            </p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#67001A] text-white text-xs font-bold hover:bg-[#520015] shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{canPostNotice ? 'Publish New Post' : 'Post Community News'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={me}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Publish Modal */}
      {showModal && me && (
        <PostFormModal
          user={me}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            setNoticeMessage('Post published successfully!');
            void refetch();
          }}
          defaultType={typeFilter === 'notice' ? 'notice' : 'news'}
        />
      )}
    </div>
  );
}
