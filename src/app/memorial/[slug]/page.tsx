'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  collection, query, where, getDocs, addDoc,
  serverTimestamp, doc, updateDoc, orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import {
  getMember, getMyJoinRequest, submitJoinRequest,
  getPendingRequests, approveJoinRequest, rejectJoinRequest,
  updateMemberDisplayName, createInviteToken,
  getMembers, kickMember, hideMember, unhideMember,
  softDeleteSpace,
  type Member, type JoinRequest,
} from '@/lib/db';

function maskName(name: string): string {
  return name.split('').map((c, i) => i % 2 === 1 ? 'O' : c).join('');
}

interface MemorialSpace {
  id: string;
  name: string;
  slug: string;
  birth_year?: number;
  death_year?: number;
  bio?: string;
  photo_url?: string;
  created_by: string;
}

interface Message {
  id: string;
  author_name: string;
  author_uid?: string;
  content: string;
  created_at: { toDate?: () => Date } | null;
}

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  author_name: string;
  author_uid?: string;
  created_at: { toDate?: () => Date } | null;
}

export default function MemorialPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();

  const [space, setSpace] = useState<MemorialSpace | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [hasRequest, setHasRequest] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'pending' | 'rejected' | null>(null);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<'messages' | 'media' | 'members'>('messages');
  const [members, setMembers] = useState<Member[]>([]);

  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [savingDisplayName, setSavingDisplayName] = useState(false);

  const [joinMessage, setJoinMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const [inviteLink, setInviteLink] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [deletingSpace, setDeletingSpace] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);

    async function load() {
      try {
        const q = query(collection(db, 'memorial_spaces'), where('slug', '==', slug));
        const snap = await getDocs(q);
        if (snap.empty) { setNotFound(true); setLoading(false); return; }

        const spaceDoc = snap.docs[0];
        const spaceData = { id: spaceDoc.id, ...spaceDoc.data() } as MemorialSpace;
        setSpace(spaceData);

        if (user) {
          const m = await getMember(spaceDoc.id, user.uid);
          if (m) {
            setMember(m);
            if (!m.space_display_name) {
              setNewDisplayName(user.displayName || '');
              setShowDisplayNameModal(true);
            }
            const [msgSnap, mediaSnap, reqs] = await Promise.all([
              getDocs(query(collection(db, 'memorial_spaces', spaceDoc.id, 'messages'), orderBy('created_at', 'desc'))),
              getDocs(query(collection(db, 'memorial_spaces', spaceDoc.id, 'media'), orderBy('created_at', 'desc'))),
              m.role === 'owner' ? getPendingRequests(spaceDoc.id) : Promise.resolve([] as JoinRequest[]),
            ]);
            setMessages(msgSnap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
            setMedia(mediaSnap.docs.map(d => ({ id: d.id, ...d.data() } as MediaItem)));
            setPendingRequests(reqs);
          } else {
            const req = await getMyJoinRequest(spaceDoc.id, user.uid);
            if (req) {
              setHasRequest(true);
              setRequestStatus(req.status as 'pending' | 'rejected');
            }
          }
        }
        setLoading(false);
      } catch (err) {
        console.error('[memorial] load error:', err);
        setNotFound(true);
        setLoading(false);
      }
    }
    load();
  }, [slug, user, authLoading]);

  async function uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
      { method: 'POST', body: formData }
    );
    const data = await res.json();
    return data.secure_url;
  }

  const myDisplayName = member?.space_display_name || user?.displayName || '익명';
  const isOwner = member?.role === 'owner';

  async function handleSubmitMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!space || !content.trim()) return;
    setSubmitting(true);
    await addDoc(collection(db, 'memorial_spaces', space.id, 'messages'), {
      author_name: myDisplayName,
      author_uid: user!.uid,
      content: content.trim(),
      created_at: serverTimestamp(),
    });
    const snap = await getDocs(query(collection(db, 'memorial_spaces', space.id, 'messages'), orderBy('created_at', 'desc')));
    setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    setContent('');
    setSubmitting(false);
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!space || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploading(true);
    const url = await uploadToCloudinary(file);
    await addDoc(collection(db, 'memorial_spaces', space.id, 'media'), {
      url,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      author_name: myDisplayName,
      author_uid: user!.uid,
      created_at: serverTimestamp(),
    });
    const snap = await getDocs(query(collection(db, 'memorial_spaces', space.id, 'media'), orderBy('created_at', 'desc')));
    setMedia(snap.docs.map(d => ({ id: d.id, ...d.data() } as MediaItem)));
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleProfileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!space || !e.target.files?.[0]) return;
    setUploadingProfile(true);
    const file = e.target.files[0];
    const url = await uploadToCloudinary(file);
    await updateDoc(doc(db, 'memorial_spaces', space.id), { photo_url: url });
    setSpace(prev => prev ? { ...prev, photo_url: url } : prev);
    setUploadingProfile(false);
  }

  async function handleSaveDisplayName() {
    if (!space || !user || !newDisplayName.trim()) return;
    setSavingDisplayName(true);
    await updateMemberDisplayName(space.id, user.uid, newDisplayName.trim());
    setMember(prev => prev ? { ...prev, space_display_name: newDisplayName.trim() } : prev);
    setShowDisplayNameModal(false);
    setSavingDisplayName(false);
  }

  async function handleJoinRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!space || !user) return;
    setSubmittingRequest(true);
    await submitJoinRequest(space.id, {
      requester_uid: user.uid,
      requester_email: user.email!,
      requester_name: user.displayName || user.email!,
      message: joinMessage.trim(),
    });
    setHasRequest(true);
    setRequestStatus('pending');
    setSubmittingRequest(false);
  }

  function handleOpenEditName() {
    setEditNameValue(member?.space_display_name || user?.displayName || '');
    setShowEditNameModal(true);
  }

  async function handleSaveEditName() {
    if (!space || !user || !editNameValue.trim()) return;
    setSavingDisplayName(true);
    await updateMemberDisplayName(space.id, user.uid, editNameValue.trim());
    setMember(prev => prev ? { ...prev, space_display_name: editNameValue.trim() } : prev);
    setShowEditNameModal(false);
    setSavingDisplayName(false);
  }

  async function handleDeleteSpace() {
    if (!space || !confirm(`"${space.name}" 공간을 숨김 처리하시겠습니까?\n멤버들의 요청으로 복구할 수 있습니다.`)) return;
    setDeletingSpace(true);
    await softDeleteSpace(space.id);
    router.push('/dashboard');
  }

  async function handleTabChange(t: 'messages' | 'media' | 'members') {
    setTab(t);
    if (t === 'members' && space && members.length === 0) {
      const list = await getMembers(space.id);
      setMembers(list);
    }
  }

  async function handleKick(uid: string) {
    if (!space || !confirm('이 멤버를 내보내시겠습니까?')) return;
    await kickMember(space.id, uid);
    setMembers(prev => prev.filter(m => m.uid !== uid));
  }

  async function handleToggleHide(targetUid: string) {
    if (!space || !user || !member) return;
    const isHidden = member.hidden_member_uids.includes(targetUid);
    if (isHidden) {
      await unhideMember(space.id, user.uid, targetUid);
      setMember(prev => prev ? { ...prev, hidden_member_uids: prev.hidden_member_uids.filter(u => u !== targetUid) } : prev);
    } else {
      await hideMember(space.id, user.uid, targetUid);
      setMember(prev => prev ? { ...prev, hidden_member_uids: [...prev.hidden_member_uids, targetUid] } : prev);
    }
  }

  async function handleGenerateInvite() {
    if (!space || !user) return;
    setGeneratingLink(true);
    const token = await createInviteToken(space.id, user.uid);
    const link = `${window.location.origin}/invite/${token}`;
    setInviteLink(link);
    setGeneratingLink(false);
  }

  async function handleApprove(req: JoinRequest) {
    if (!space) return;
    await approveJoinRequest(space.id, req.id, req.requester_uid);
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
  }

  async function handleReject(req: JoinRequest) {
    if (!space) return;
    await rejectJoinRequest(space.id, req.id);
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
  }

  // ---- 로딩 / 없는 공간 ----
  if (loading || authLoading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">불러오는 중...</div>
  );

  if (notFound || !space) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <p className="text-gray-400 text-sm">존재하지 않는 공간입니다.</p>
      <Link href="/" className="text-sm text-gray-900 font-semibold hover:underline">홈으로</Link>
    </div>
  );

  // ---- 비멤버 미리보기 ----
  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <Link href="/" className="text-base font-bold text-gray-900">The Untold</Link>
          {user
            ? <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">← 내 공간</Link>
            : <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">로그인</Link>
          }
        </nav>

        <div className="bg-white border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200 mb-6">
              {space.photo_url
                ? <img src={space.photo_url} alt="" className="w-full h-full object-cover blur-md" />
                : <span className="text-5xl" style={{ filter: 'blur(4px)' }}>🕊️</span>
              }
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{maskName(space.name)}</h1>
            {(space.birth_year || space.death_year) && (
              <p className="text-sm text-gray-400 mb-3">
                {space.birth_year ?? ''}{space.birth_year && space.death_year ? ' — ' : ''}{space.death_year ?? ''}
              </p>
            )}
            {space.bio && (
              <div className="relative max-w-md w-full mt-1">
                <p className="text-sm text-gray-600 leading-relaxed blur-sm select-none">{space.bio}</p>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-gray-500 bg-white/90 px-3 py-1 rounded-full border border-gray-200">멤버만 볼 수 있습니다</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl border border-gray-200 p-10 flex flex-col items-center text-center gap-3 mb-8">
            <div className="text-4xl">🔒</div>
            <p className="text-sm font-semibold text-gray-700">이 공간의 내용은 멤버만 볼 수 있습니다</p>
            <p className="text-xs text-gray-400">입장 요청을 보내면 방장의 승인 후 멤버가 될 수 있습니다</p>
          </div>

          {!user ? (
            <div className="text-center flex flex-col items-center gap-4">
              <p className="text-sm text-gray-500">입장을 요청하려면 먼저 로그인해주세요</p>
              <Link href={`/login`}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors">
                로그인하기
              </Link>
            </div>
          ) : hasRequest ? (
            <div className={`rounded-2xl p-6 text-center border ${requestStatus === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              {requestStatus === 'rejected'
                ? <><p className="text-sm font-semibold text-red-700 mb-1">입장 요청이 거절됐습니다</p>
                    <p className="text-xs text-red-400">방장에게 문의해주세요</p></>
                : <><p className="text-sm font-semibold text-blue-700 mb-1">요청을 보냈습니다</p>
                    <p className="text-xs text-blue-400">방장의 승인을 기다리고 있습니다</p></>
              }
            </div>
          ) : (
            <form onSubmit={handleJoinRequest} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-1">입장 요청하기</h2>
                <p className="text-xs text-gray-400">고인과의 관계나 간단한 소개를 적어주세요</p>
              </div>
              <textarea
                value={joinMessage}
                onChange={e => setJoinMessage(e.target.value)}
                required rows={4}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white resize-none"
                placeholder="예: 저는 고인의 친구 김OO입니다. 함께했던 소중한 시간들을 나누고 싶습니다."
              />
              <button
                type="submit" disabled={submittingRequest || !joinMessage.trim()}
                className="bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50">
                {submittingRequest ? '요청 중...' : '요청 보내기'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ---- 멤버 뷰 ----
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 대화명 설정 모달 */}
      {showDisplayNameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">이 공간에서 사용할 대화명</h2>
              <p className="text-sm text-gray-500">추모글과 사진에 표시될 이름입니다. 나중에 변경할 수 있어요.</p>
            </div>
            <input
              type="text"
              value={newDisplayName}
              onChange={e => setNewDisplayName(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder={user?.displayName || '대화명 입력'}
              autoFocus
            />
            <button
              onClick={handleSaveDisplayName}
              disabled={savingDisplayName || !newDisplayName.trim()}
              className="bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50">
              {savingDisplayName ? '저장 중...' : '저장하고 입장'}
            </button>
          </div>
        </div>
      )}

      {/* 대화명 변경 모달 */}
      {showEditNameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">대화명 변경</h2>
              <p className="text-sm text-gray-500">이 공간에서 표시될 이름을 변경합니다.</p>
            </div>
            <input
              type="text"
              value={editNameValue}
              onChange={e => setEditNameValue(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="대화명 입력"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setShowEditNameModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                취소
              </button>
              <button onClick={handleSaveEditName}
                disabled={savingDisplayName || !editNameValue.trim()}
                className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50">
                {savingDisplayName ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-base font-bold text-gray-900">The Untold</Link>
        <div className="flex items-center gap-3">
          <button onClick={handleOpenEditName}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-2">
            {myDisplayName}
          </button>
          {user && <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← 내 공간</Link>}
        </div>
      </nav>

      {/* 방장: 입장 요청 목록 */}
      {isOwner && pendingRequests.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-2xl mx-auto px-6 py-4">
            <p className="text-sm font-semibold text-amber-800 mb-3">입장 요청 {pendingRequests.length}건</p>
            <div className="flex flex-col gap-3">
              {pendingRequests.map(req => (
                <div key={req.id} className="bg-white rounded-xl p-4 border border-amber-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">{req.requester_name}</span>
                    <span className="text-xs text-gray-400">{req.requester_email}</span>
                  </div>
                  {req.message && <p className="text-sm text-gray-500 italic">"{req.message}"</p>}
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => handleApprove(req)}
                      className="flex-1 bg-gray-900 text-white py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-700 transition-colors">
                      승인
                    </button>
                    <button onClick={() => handleReject(req)}
                      className="flex-1 bg-white text-gray-600 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 hover:bg-gray-50 transition-colors">
                      거절
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 방장: 초대 링크 */}
      {isOwner && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-2xl mx-auto px-6 py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">초대 링크 생성</p>
              <button
                onClick={handleGenerateInvite}
                disabled={generatingLink}
                className="text-xs bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
                {generatingLink ? '생성 중...' : '새 링크 만들기'}
              </button>
            </div>
            {inviteLink && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200">
                <span className="text-xs text-gray-600 flex-1 truncate">{inviteLink}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(inviteLink); }}
                  className="text-xs text-gray-900 font-semibold hover:underline whitespace-nowrap">
                  복사
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400">링크는 7일 후 만료되며, 1회만 사용 가능합니다</p>
          </div>
        </div>
      )}

      {/* 방장: 공간 숨김 처리 */}
      {isOwner && (
        <div className="bg-red-50 border-b border-red-100">
          <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
            <p className="text-xs text-red-400">공간을 숨김 처리하면 대시보드에서 보이지 않습니다</p>
            <button
              onClick={handleDeleteSpace}
              disabled={deletingSpace}
              className="text-xs text-red-500 border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
              {deletingSpace ? '처리 중...' : '공간 숨기기'}
            </button>
          </div>
        </div>
      )}

      {/* 프로필 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
              {space.photo_url
                ? <img src={space.photo_url} alt={space.name} className="w-full h-full object-cover" />
                : <span className="text-5xl">🕊️</span>
              }
            </div>
            {isOwner && (
              <>
                <button
                  onClick={() => profileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs hover:bg-gray-700 transition-colors"
                  title="사진 변경"
                >{uploadingProfile ? '…' : '✎'}</button>
                <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfileUpload} />
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{space.name}</h1>
          {(space.birth_year || space.death_year) && (
            <p className="text-sm text-gray-400 mb-3">
              {space.birth_year ?? ''}{space.birth_year && space.death_year ? ' — ' : ''}{space.death_year ?? ''}
            </p>
          )}
          {space.bio && (
            <p className="text-sm text-gray-600 leading-relaxed max-w-md whitespace-pre-wrap">{space.bio}</p>
          )}
        </div>
      </div>

      {/* 탭 */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="flex border-b border-gray-200 mt-6 mb-6">
          <button onClick={() => handleTabChange('messages')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === 'messages' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            추모글 ({messages.length})
          </button>
          <button onClick={() => handleTabChange('media')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === 'media' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            사진·영상 ({media.length})
          </button>
          <button onClick={() => handleTabChange('members')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === 'members' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            멤버
          </button>
        </div>

        {/* 추모글 */}
        {tab === 'messages' && (
          <div className="flex flex-col gap-5 pb-12">
            <form onSubmit={handleSubmitMessage} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">작성자:</span>
                <span className="text-xs font-semibold text-gray-700">{myDisplayName}</span>
              </div>
              <textarea
                value={content} onChange={e => setContent(e.target.value)} required rows={4}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white resize-none"
                placeholder="따뜻한 말 한마디를 남겨주세요..."
              />
              <button
                type="submit" disabled={submitting || !content.trim()}
                className="bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50">
                {submitting ? '등록 중...' : '등록'}
              </button>
            </form>

            {messages.length === 0
              ? <p className="text-center text-gray-400 text-sm py-12">아직 추모글이 없습니다.</p>
              : messages.filter(msg => !msg.author_uid || !member?.hidden_member_uids.includes(msg.author_uid)).map(msg => (
                <div key={msg.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">{msg.author_name}</span>
                    <span className="text-xs text-gray-400">{msg.created_at?.toDate?.()?.toLocaleDateString('ko-KR') ?? ''}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))
            }
          </div>
        )}

        {/* 사진·영상 */}
        {tab === 'media' && (
          <div className="flex flex-col gap-5 pb-12">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">업로더:</span>
                <span className="text-xs font-semibold text-gray-700">{myDisplayName}</span>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="border-2 border-dashed border-gray-200 rounded-lg py-8 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">
                {uploading ? '업로드 중...' : '+ 사진 또는 동영상 선택'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
            </div>

            {media.length === 0
              ? <p className="text-center text-gray-400 text-sm py-12">아직 올라온 사진·영상이 없습니다.</p>
              : (
                <div className="grid grid-cols-2 gap-3">
                  {media.filter(item => !item.author_uid || !member?.hidden_member_uids.includes(item.author_uid)).map(item => (
                    <div key={item.id} className="rounded-xl overflow-hidden bg-gray-100 aspect-square relative">
                      {item.type === 'video'
                        ? <video src={item.url} controls className="w-full h-full object-cover" />
                        : <img src={item.url} alt="" className="w-full h-full object-cover" />
                      }
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2">
                        <span className="text-xs text-white">{item.author_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}
        {/* 멤버 */}
        {tab === 'members' && (
          <div className="flex flex-col gap-3 pb-12">
            {members.length === 0
              ? <p className="text-center text-gray-400 text-sm py-12">멤버 목록을 불러오는 중...</p>
              : members.map(m => {
                const isMe = m.uid === user?.uid;
                const isHidden = member?.hidden_member_uids.includes(m.uid) ?? false;
                return (
                  <div key={m.uid} className="bg-white rounded-2xl px-5 py-4 border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-gray-800">
                        {m.space_display_name || '(대화명 미설정)'}
                      </span>
                      {m.role === 'owner' && (
                        <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">방장</span>
                      )}
                      {isMe && (
                        <span className="ml-2 text-xs text-blue-400">나</span>
                      )}
                    </div>
                    {!isMe && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleHide(m.uid)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${isHidden ? 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-white' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                          {isHidden ? '숨김 해제' : '숨기기'}
                        </button>
                        {isOwner && m.role !== 'owner' && (
                          <button
                            onClick={() => handleKick(m.uid)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                            내보내기
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            }
          </div>
        )}
      </div>
    </div>
  );
}
