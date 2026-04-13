'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

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
  content: string;
  created_at: { toDate?: () => Date } | null;
}

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  author_name: string;
  created_at: { toDate?: () => Date } | null;
}

export default function MemorialPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [space, setSpace] = useState<MemorialSpace | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<'messages' | 'media'>('messages');

  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [mediaAuthorName, setMediaAuthorName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const q = query(collection(db, 'memorial_spaces'), where('slug', '==', slug));
      const snap = await getDocs(q);
      if (snap.empty) { setNotFound(true); setLoading(false); return; }
      const spaceDoc = snap.docs[0];
      const spaceData = { id: spaceDoc.id, ...spaceDoc.data() } as MemorialSpace;
      setSpace(spaceData);

      const [msgSnap, mediaSnap] = await Promise.all([
        getDocs(query(collection(db, 'memorial_spaces', spaceDoc.id, 'messages'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'memorial_spaces', spaceDoc.id, 'media'), orderBy('created_at', 'desc'))),
      ]);
      setMessages(msgSnap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      setMedia(mediaSnap.docs.map(d => ({ id: d.id, ...d.data() } as MediaItem)));
      setLoading(false);
    }
    fetchData();
  }, [slug]);

  async function handleSubmitMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!space || !content.trim()) return;
    setSubmitting(true);
    await addDoc(collection(db, 'memorial_spaces', space.id, 'messages'), {
      author_name: authorName.trim() || '익명',
      content: content.trim(),
      created_at: serverTimestamp(),
    });
    const snap = await getDocs(query(collection(db, 'memorial_spaces', space.id, 'messages'), orderBy('created_at', 'desc')));
    setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    setContent('');
    setAuthorName('');
    setSubmitting(false);
  }

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

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!space || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploading(true);
    const url = await uploadToCloudinary(file);
    await addDoc(collection(db, 'memorial_spaces', space.id, 'media'), {
      url,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      author_name: mediaAuthorName.trim() || '익명',
      created_at: serverTimestamp(),
    });
    const snap = await getDocs(query(collection(db, 'memorial_spaces', space.id, 'media'), orderBy('created_at', 'desc')));
    setMedia(snap.docs.map(d => ({ id: d.id, ...d.data() } as MediaItem)));
    setMediaAuthorName('');
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">불러오는 중...</div>
  );
  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <p className="text-gray-400 text-sm">존재하지 않는 공간입니다.</p>
      <Link href="/" className="text-sm text-gray-900 font-semibold hover:underline">홈으로</Link>
    </div>
  );
  if (!space) return null;

  const isOwner = user?.uid === space.created_by;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-base font-bold text-gray-900">The Untold</Link>
        {user && <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← 내 공간</Link>}
      </nav>

      {/* 프로필 영역 */}
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
                >
                  {uploadingProfile ? '…' : '✎'}
                </button>
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
          <button
            onClick={() => setTab('messages')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === 'messages' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            추모글 ({messages.length})
          </button>
          <button
            onClick={() => setTab('media')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === 'media' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            사진·영상 ({media.length})
          </button>
        </div>

        {/* 추모글 탭 */}
        {tab === 'messages' && (
          <div className="flex flex-col gap-5 pb-12">
            <form onSubmit={handleSubmitMessage} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-gray-700">추모글 남기기</h2>
              <input
                type="text" value={authorName} onChange={e => setAuthorName(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                placeholder="이름 (선택, 미입력 시 익명)"
              />
              <textarea
                value={content} onChange={e => setContent(e.target.value)} required rows={4}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white resize-none"
                placeholder="따뜻한 말 한마디를 남겨주세요..."
              />
              <button
                type="submit" disabled={submitting || !content.trim()}
                className="bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
            </form>

            {messages.length === 0
              ? <p className="text-center text-gray-400 text-sm py-12">아직 추모글이 없습니다.</p>
              : messages.map(msg => (
                <div key={msg.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">{msg.author_name}</span>
                    <span className="text-xs text-gray-400">
                      {msg.created_at?.toDate?.()?.toLocaleDateString('ko-KR') ?? ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))
            }
          </div>
        )}

        {/* 사진·영상 탭 */}
        {tab === 'media' && (
          <div className="flex flex-col gap-5 pb-12">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-gray-700">사진·영상 올리기</h2>
              <input
                type="text" value={mediaAuthorName} onChange={e => setMediaAuthorName(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                placeholder="이름 (선택, 미입력 시 익명)"
              />
              <button
                onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="border-2 border-dashed border-gray-200 rounded-lg py-8 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                {uploading ? '업로드 중...' : '+ 사진 또는 동영상 선택'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
            </div>

            {media.length === 0
              ? <p className="text-center text-gray-400 text-sm py-12">아직 올라온 사진·영상이 없습니다.</p>
              : (
                <div className="grid grid-cols-2 gap-3">
                  {media.map(item => (
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
      </div>
    </div>
  );
}
