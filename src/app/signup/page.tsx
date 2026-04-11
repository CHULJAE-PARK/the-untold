'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('email-already-in-use')) {
        setError('이미 사용 중인 이메일입니다.');
      } else if (msg.includes('weak-password')) {
        setError('비밀번호는 6자 이상이어야 합니다.');
      } else {
        setError('회원가입 중 오류가 발생했습니다.');
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-bold text-stone-800">The Untold</Link>
          <p className="text-sm text-stone-500 mt-2">새 계정을 만드세요</p>
        </div>
        <form onSubmit={handleSignup} className="bg-white rounded-2xl p-8 border border-stone-100 shadow-sm flex flex-col gap-4">
          {error && <div className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">{error}</div>}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500">이름</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="홍길동" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500">이메일</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="name@example.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500">비밀번호</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="6자 이상" />
          </div>
          <button type="submit" disabled={loading}
            className="bg-stone-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-stone-700 transition-colors disabled:opacity-50 mt-2">
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>
        <p className="text-center text-sm text-stone-400 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-stone-700 font-semibold hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}
