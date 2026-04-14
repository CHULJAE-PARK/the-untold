'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
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
      router.push(redirect || '/dashboard');
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col gap-4">
      {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</div>}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-600">이메일</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
          placeholder="name@example.com" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-600">비밀번호</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
          placeholder="••••••••" />
      </div>
      <button type="submit" disabled={loading}
        className="bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 mt-2">
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-base font-bold text-gray-900">The Untold</Link>
          <p className="text-sm text-gray-500 mt-2">로그인하여 계속하세요</p>
        </div>
        <Suspense fallback={<div className="h-48 bg-white rounded-2xl border border-gray-200" />}>
          <LoginForm />
        </Suspense>
        <p className="text-center text-sm text-gray-400 mt-6">
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className="text-gray-900 font-semibold hover:underline">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
