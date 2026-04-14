'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  GoogleAuthProvider,
  updatePassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { deleteUserAccount } from '@/lib/db';

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  const [deleting, setDeleting] = useState(false);

  const isPasswordUser = user?.providerData[0]?.providerId === 'password';

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (user) setDisplayName(user.displayName || '');
  }, [user, loading, router]);

  async function handleSaveName() {
    if (!user || !displayName.trim()) return;
    setSavingName(true);
    setNameMsg('');
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      setNameMsg('저장되었습니다.');
    } catch {
      setNameMsg('저장에 실패했습니다.');
    }
    setSavingName(false);
  }

  async function handleChangePassword() {
    if (!user || !user.email) return;
    setPwMsg('');
    if (newPw.length < 6) { setPwMsg('새 비밀번호는 6자 이상이어야 합니다.'); return; }
    if (newPw !== confirmPw) { setPwMsg('새 비밀번호가 일치하지 않습니다.'); return; }
    setSavingPw(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPw);
      setPwMsg('비밀번호가 변경되었습니다.');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch {
      setPwMsg('현재 비밀번호가 올바르지 않습니다.');
    }
    setSavingPw(false);
  }

  async function handleDeleteAccount() {
    if (!user) return;
    if (!confirm('정말 계정을 삭제하시겠습니까?\n\n소유한 공간은 숨김 처리되고, 참여한 공간에서는 탈퇴됩니다.\n이 작업은 되돌릴 수 없습니다.')) return;
    const typed = prompt(`삭제를 확인하려면 이메일 "${user.email}"을(를) 입력하세요:`);
    if (typed !== user.email) { alert('이메일이 일치하지 않습니다.'); return; }

    setDeleting(true);
    try {
      // 재인증
      if (isPasswordUser) {
        const pw = prompt('본인 확인을 위해 비밀번호를 입력하세요:');
        if (!pw) { setDeleting(false); return; }
        const credential = EmailAuthProvider.credential(user.email!, pw);
        await reauthenticateWithCredential(user, credential);
      } else {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      }

      // DB 정리 후 Auth 삭제
      await deleteUserAccount(user.uid);
      await user.delete();
      router.push('/');
    } catch {
      alert('계정 삭제에 실패했습니다. 다시 시도해주세요.');
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">불러오는 중...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-base font-bold text-gray-900">The Untold</Link>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← 내 공간</Link>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-10 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">계정 설정</h1>
          <p className="text-sm text-gray-400 mt-0.5">개인 정보와 계정을 관리합니다.</p>
        </div>

        {/* 계정 정보 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4">계정 정보</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">이메일</span>
              <span className="text-gray-700">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">로그인 방식</span>
              <span className="text-gray-700">{isPasswordUser ? '이메일 계정' : 'Google 계정'}</span>
            </div>
          </div>
        </div>

        {/* 표시 이름 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4">표시 이름</h2>
          <div className="flex flex-col gap-3">
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="이름 입력" />
            <button onClick={handleSaveName} disabled={savingName || !displayName.trim()}
              className="bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50">
              {savingName ? '저장 중...' : '저장'}
            </button>
            {nameMsg && <p className="text-xs text-gray-500">{nameMsg}</p>}
          </div>
        </div>

        {/* 비밀번호 변경 (이메일 계정만) */}
        {isPasswordUser && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-4">비밀번호 변경</h2>
            <div className="flex flex-col gap-3">
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="현재 비밀번호" />
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="새 비밀번호 (6자 이상)" />
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="새 비밀번호 확인" />
              <button onClick={handleChangePassword}
                disabled={savingPw || !currentPw || !newPw || !confirmPw}
                className="bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50">
                {savingPw ? '변경 중...' : '비밀번호 변경'}
              </button>
              {pwMsg && <p className="text-xs text-gray-500">{pwMsg}</p>}
            </div>
          </div>
        )}

        {/* 계정 삭제 */}
        <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
          <h2 className="text-sm font-bold text-red-600 mb-2">계정 삭제</h2>
          <p className="text-xs text-gray-500 mb-4">
            계정을 삭제하면 소유한 공간은 숨김 처리되고, 참여한 공간에서는 탈퇴됩니다. 이 작업은 되돌릴 수 없습니다.
          </p>
          <button onClick={handleDeleteAccount} disabled={deleting}
            className="w-full text-sm text-red-500 border border-red-200 py-2.5 rounded-lg font-semibold hover:bg-red-100 transition-colors disabled:opacity-50">
            {deleting ? '삭제 중...' : '계정 영구 삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}
