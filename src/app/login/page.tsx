'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50/30 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-bold text-amber-900">The Untold</Link>
          <p className="text-sm text-stone-500 mt-2">로그인하여 계속하세요</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white rounded-3xl p-8 border border-amber-100 shadow-sm shadow-amber-100 flex flex-col gap-4">
          {error && <div className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</div>}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500">이메일</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="border border-amber-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-amber-50/30"
              placeholder="name@example.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500">비밀번호</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="border border-amber-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-amber-50/30"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="bg-amber-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 mt-2">
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="text-center text-sm text-stone-400 mt-6">
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className="text-amber-600 font-semibold hover:underline">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
