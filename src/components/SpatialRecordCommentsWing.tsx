import React, { useState } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  User,
  Shield,
  Trash2,
  X,
  Sparkles,
  ArrowUpDown,
  Edit3,
  Check,
  Tag,
  Building,
  GraduationCap,
  MapPin,
  Compass,
  Users
} from 'lucide-react';
import {
  SpatialAnnotation,
  SpatialComment,
  AudienceUserCredentials,
  PRESET_AUDIENCE_ROLES,
  UiTheme,
  AppViewMode
} from '../types';

interface SpatialRecordCommentsWingProps {
  annotation: SpatialAnnotation;
  viewMode: AppViewMode;
  audienceUser: AudienceUserCredentials;
  onUpdateAudienceUser: (creds: AudienceUserCredentials) => void;
  onAddComment: (annotationId: string, text: string, authorName: string, authorRole: string) => void;
  onVoteComment: (annotationId: string, commentId: string, direction: 'up' | 'down') => void;
  onDeleteComment: (annotationId: string, commentId: string) => void;
  onClose: () => void;
  uiTheme?: UiTheme;
  onDragStart?: (e: React.PointerEvent) => void;
}

export const SpatialRecordCommentsWing: React.FC<SpatialRecordCommentsWingProps> = ({
  annotation,
  viewMode,
  audienceUser,
  onUpdateAudienceUser,
  onAddComment,
  onVoteComment,
  onDeleteComment,
  onClose,
  uiTheme = 'dark',
  onDragStart
}) => {
  const [commentText, setCommentText] = useState('');
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');
  const [isEditingCreds, setIsEditingCreds] = useState(false);
  const [tempName, setTempName] = useState(audienceUser.name || 'Visitor');
  const [tempRole, setTempRole] = useState(audienceUser.role || 'Local Resident');
  const [customRoleInput, setCustomRoleInput] = useState('');

  const isLight = uiTheme === 'light';
  const isResearcher = viewMode === 'researcher';

  const comments = annotation.comments || [];

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'top') {
      const ptsA = (a.upvotes || 0) - (a.downvotes || 0);
      const ptsB = (b.upvotes || 0) - (b.downvotes || 0);
      if (ptsB !== ptsA) return ptsB - ptsA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const authorName = audienceUser.name.trim() || 'Visitor';
    const authorRole = audienceUser.role.trim() || 'Local Resident';

    onAddComment(annotation.id, commentText.trim(), authorName, authorRole);
    setCommentText('');
  };

  const handleSaveCreds = () => {
    const finalName = tempName.trim() || 'Visitor';
    const finalRole = (customRoleInput.trim() || tempRole).trim() || 'Local Resident';
    onUpdateAudienceUser({ name: finalName, role: finalRole });
    setIsEditingCreds(false);
  };

  const getRoleBadgeClasses = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('resident') || r.includes('community')) {
      return isLight
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
    if (r.includes('municipal') || r.includes('worker') || r.includes('city')) {
      return isLight
        ? 'bg-blue-100 text-blue-800 border-blue-300'
        : 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
    if (r.includes('epigraph') || r.includes('archaeolog') || r.includes('histor')) {
      return isLight
        ? 'bg-purple-100 text-purple-800 border-purple-300'
        : 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    }
    if (r.includes('architect') || r.includes('engineer')) {
      return isLight
        ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
    if (r.includes('conserv')) {
      return isLight
        ? 'bg-rose-100 text-rose-800 border-rose-300'
        : 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
    if (r.includes('student') || r.includes('educat')) {
      return isLight
        ? 'bg-amber-100 text-amber-800 border-amber-300'
        : 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
    return isLight
      ? 'bg-slate-100 text-slate-700 border-slate-300'
      : 'bg-zinc-800 text-zinc-300 border-zinc-700';
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`w-88 sm:w-[420px] max-w-[calc(100vw-2rem)] max-h-[82vh] flex flex-col backdrop-blur-2xl border rounded-3xl shadow-2xl pointer-events-auto transition-all animate-in fade-in slide-in-from-right-4 duration-200 overflow-hidden ${
        isLight
          ? 'bg-white/98 border-amber-300 text-slate-900 shadow-amber-950/15 ring-1 ring-amber-300/80'
          : 'bg-[#0B0B0E]/98 border-amber-500/40 text-zinc-100 shadow-black/90 ring-1 ring-amber-500/20'
      }`}
    >
      {/* Header Banner */}
      <div
        onPointerDown={onDragStart}
        className={`px-4 py-3 flex items-center justify-between border-b select-none shrink-0 ${
          onDragStart ? 'cursor-move' : ''
        } ${
          isLight
            ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-amber-200/80'
            : 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-purple-500/15 border-amber-500/30'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center font-bold shadow-xs">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>Community & Audience Notes</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                {comments.length}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate max-w-[200px]">
              {annotation.title}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Sort Switcher */}
          <div className="flex items-center rounded-lg p-0.5 border border-amber-500/30 bg-black/10 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setSortBy('top')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                sortBy === 'top'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-amber-500'
              }`}
            >
              Top
            </button>
            <button
              type="button"
              onClick={() => setSortBy('newest')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                sortBy === 'newest'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-amber-500'
              }`}
            >
              Newest
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full border transition-colors ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white border-zinc-700'
            }`}
            title="Close Comments Wing"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* User Identity / Credential Bar */}
      <div
        className={`px-4 py-2 border-b text-xs shrink-0 ${
          isLight
            ? 'bg-amber-50/60 border-amber-200 text-slate-700'
            : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
        }`}
      >
        {isEditingCreds ? (
          <div className="space-y-2 py-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <User className="w-3.5 h-3.5" /> Edit Your Identity
              </span>
              <button
                type="button"
                onClick={handleSaveCreds}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] flex items-center gap-1 shadow-xs"
              >
                <Check className="w-3 h-3" /> Save
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 dark:text-zinc-400">
                  Name / Nickname
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="e.g. Elena Vance"
                  className={`w-full text-xs px-2.5 py-1.5 rounded-lg border font-medium ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-zinc-950 border-zinc-700 text-zinc-200'
                  }`}
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 dark:text-zinc-400">
                  Role / Affiliation
                </label>
                <select
                  value={tempRole}
                  onChange={(e) => {
                    setTempRole(e.target.value);
                    if (e.target.value !== 'Other') setCustomRoleInput('');
                  }}
                  className={`w-full text-xs px-2.5 py-1.5 rounded-lg border font-medium ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-zinc-950 border-zinc-700 text-zinc-200'
                  }`}
                >
                  {PRESET_AUDIENCE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  <option value="Other">Custom Role...</option>
                </select>
              </div>
            </div>

            {tempRole === 'Other' && (
              <input
                type="text"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                placeholder="Type your role (e.g. Epigrapher, Local Elder)"
                className={`w-full text-xs px-2.5 py-1.5 rounded-lg border font-medium ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-zinc-950 border-zinc-700 text-zinc-200'
                }`}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Commenting as:</span>
              <span className="font-bold text-slate-900 dark:text-zinc-100 truncate">
                {audienceUser.name || 'Visitor'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getRoleBadgeClasses(
                  audienceUser.role || 'Local Resident'
                )}`}
              >
                {audienceUser.role || 'Local Resident'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setTempName(audienceUser.name || 'Visitor');
                setTempRole(audienceUser.role || 'Local Resident');
                setIsEditingCreds(true);
              }}
              className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-bold shrink-0 flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Change
            </button>
          </div>
        )}
      </div>

      {/* Comments List Stream */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar min-h-[160px] max-h-[360px]">
        {sortedComments.length === 0 ? (
          <div className="py-8 px-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              No audience notes yet
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
              Be the first to share local observations, epigraphic notes, or municipal feedback on this 3D marker!
            </p>
          </div>
        ) : (
          sortedComments.map((cmt) => {
            const netPoints = (cmt.upvotes || 0) - (cmt.downvotes || 0);
            const isPositive = netPoints > 0;
            const isNegative = netPoints < 0;

            const timeStr = (() => {
              try {
                const date = new Date(cmt.createdAt);
                return date.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
              } catch (_) {
                return 'Recent';
              }
            })();

            return (
              <div
                key={cmt.id}
                className={`p-3 rounded-2xl border transition-all text-xs space-y-2 ${
                  isLight
                    ? 'bg-slate-50/90 hover:bg-slate-50 border-slate-200/80 shadow-xs'
                    : 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800/80'
                }`}
              >
                {/* Comment Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-zinc-100">
                      {cmt.authorName}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${getRoleBadgeClasses(
                        cmt.authorRole
                      )}`}
                    >
                      {cmt.authorRole}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">
                    <span>{timeStr}</span>
                    {(isResearcher || cmt.authorName === audienceUser.name) && (
                      <button
                        type="button"
                        onClick={() => onDeleteComment(annotation.id, cmt.id)}
                        className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-0.5"
                        title="Delete note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Body */}
                <p className="text-slate-700 dark:text-zinc-300 leading-relaxed break-words whitespace-pre-wrap font-sans text-xs">
                  {cmt.text}
                </p>

                {/* Vote & Point Bar */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-zinc-800/60">
                  <div className="flex items-center gap-1 text-xs">
                    {/* Upvote Button */}
                    <button
                      type="button"
                      onClick={() => onVoteComment(annotation.id, cmt.id, 'up')}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold transition-all ${
                        cmt.userVote === 'up'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : isLight
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                      }`}
                      title="Helpful insight (+1 Point)"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{cmt.upvotes || 0}</span>
                    </button>

                    {/* Downvote Button */}
                    <button
                      type="button"
                      onClick={() => onVoteComment(annotation.id, cmt.id, 'down')}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold transition-all ${
                        cmt.userVote === 'down'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : isLight
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                      }`}
                      title="Downvote point (-1 Point)"
                    >
                      <ThumbsDown className="w-3 h-3" />
                      <span>{cmt.downvotes || 0}</span>
                    </button>
                  </div>

                  {/* Net Points Pill */}
                  <div
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isPositive
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                        : isNegative
                        ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
                        : 'text-slate-400 dark:text-zinc-500 bg-zinc-800/40'
                    }`}
                  >
                    {isPositive ? `+${netPoints}` : netPoints} {Math.abs(netPoints) === 1 ? 'pt' : 'pts'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Comment Input Footer */}
      <form
        onSubmit={handleSubmitComment}
        className={`p-3 border-t shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950/90 border-zinc-800'
        }`}
      >
        <div className="relative">
          <textarea
            rows={2}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={`Add a public note as ${audienceUser.name || 'Visitor'} (${audienceUser.role || 'Local Resident'})...`}
            className={`w-full text-xs p-2.5 pr-10 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-amber-500 transition-all font-sans leading-relaxed ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                : 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500'
            }`}
          />

          <button
            type="submit"
            disabled={!commentText.trim()}
            className="absolute right-2 bottom-2.5 p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
            title="Post Comment"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 dark:text-zinc-400 px-0.5">
          <span>Public audience records are synced with project export.</span>
          <span>Shift+Enter for newline</span>
        </div>
      </form>
    </div>
  );
};
