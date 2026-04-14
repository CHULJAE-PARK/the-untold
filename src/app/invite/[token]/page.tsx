'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { getInviteByToken, getMember, addMember, markInviteUsed } from '@/lib/db';

type Status = 'loading' | 'invalid' | 'expired' | 'already_used' | 'already_member' | 'ready' | 'joining' | 'done' | 'need_login';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<Status>('loading');
  const [spaceName, setSpaceName] = useState('');
  const [spaceSlug, setSpaceSlug] = useState('');
  const [spaceId, setSpaceId] = useState('');

  useEffect(() => {
    if (authLoading) return;
    async function check() {
      const invite = await getInviteByToken(token);
      if (!invite) { setStatus('invalid'); return; }
      if (invite.used) { setStatus('already_used'); return; }
      const expires = invite.expires_at?.toDate?.();
      if (expires && expires < new Date()) { setStatus('expired'); return; }

      const spaceSnap = await getDoc(doc(db, 'memorial_spaces', invite.space_id));
      if (!spaceSnap.exists()) { setStatus('invalid'); return; }
      const data = spaceSnap.data();
      setSpaceName(data.name);
      setSpaceSlug(data.slug);
      setSpaceId(invite.space_id);

      if (!user) { setStatus('need_login'); return; }

      const m = await getMember(invite.space_id, user.uid);
      if (m) { setStatus('already_member'); return; }

      setStatus('ready');
    }
    check();
  }, [token, user, authLoading]);

  async function handleJoin() {
    if (!user || !spaceId) return;
    setStatus('joining');
    await addMember(spaceId, user.uid, 'member', user.displayName || null);
    await markInviteUsed(token, user.uid);
    setStatus('done');
    setTimeout(() => router.push(`/memorial/${spaceSlug}`), 1500);
  }

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">확인 중...</div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-sm w-full flex flex-col items-center gap-5 text-center">
        {status === 'invalid' && (
          <>
            <div className="text-4xl">❌</div>
            <p className="text-sm font-semibold text-gray-700">유효하지 않은 초대 링크입니다</p>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">홈으로</Link>
          </>
        )}
        {status === 'expired' && (
          <>
            <div className="text-4xl">⏰</div>
            <p className="text-sm font-semibold text-gray-700">만료된 초대 링크입니다</p>
            <p className="text-xs text-gray-400">방장에게 새 링크를 요청하세요</p>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">홈으로</Link>
          </>
        )}
        {status === 'already_used' && (
          <>
            <div className="text-4xl">🔗</div>
            <p className="text-sm font-semibold text-gray-700">이미 사용된 초대 링크입니다</p>
            <p className="text-xs text-gray-400">방장에게 새 링크를 요청하세요</p>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">홈으로</Link>
          </>
        )}
        {status === 'need_login' && (
          <>
            <div className="text-4xl">🔑</div>
            <p className="text-sm font-semibold text-gray-700">로그인이 필요합니다</p>
            {spaceName && <p className="text-xs text-gray-400">"{spaceName}" 공간에 입장하려면 로그인해주세요</p>}
            <Link
              href={`/login?redirect=/invite/${token}`}
              className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors w-full">
              로그인하기
            </Link>
          </>
        )}
        {status === 'already_member' && (
          <>
            <div className="text-4xl">✅</div>
            <p className="text-sm font-semibold text-gray-700">이미 멤버입니다</p>
            <Link href={`/memorial/${spaceSlug}`}
              className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors w-full">
              공간으로 이동
            </Link>
          </>
        )}
        {status === 'ready' && (
          <>
            <div className="text-4xl">🕊️</div>
            <div>
              <p className="text-base font-bold text-gray-900 mb-1">"{spaceName}" 공간에 초대됐습니다</p>
              <p className="text-xs text-gray-400">입장 버튼을 눌러 멤버가 되세요</p>
            </div>
            <button
              onClick={handleJoin}
              className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors w-full">
              입장하기
            </button>
          </>
        )}
        {status === 'joining' && (
          <p className="text-sm text-gray-500">입장 중...</p>
        )}
        {status === 'done' && (
          <>
            <div className="text-4xl">🎉</div>
            <p className="text-sm font-semibold text-gray-700">멤버가 됐습니다! 이동 중...</p>
          </>
        )}
      </div>
    </div>
  );
}
