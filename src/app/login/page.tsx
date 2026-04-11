'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-bold text-stone-800">The Untold</Link>
          <p className="text-sm text-stone-500 mt-2">로그인하여 계속하세요</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-8 border border-stone-100 shadow-sm flex flex-col gap-4">
          {error && (
            <div className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">{error}</div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500">이메일</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="name@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-stone-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-stone-700 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-center text-sm text-stone-400 mt-6">
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className="text-stone-700 font-semibold hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
