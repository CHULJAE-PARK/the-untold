'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-4 text-center">
        <div className="text-4xl mb-4">✉️</div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">이메일을 확인해주세요</h2>
        <p className="text-sm text-stone-500 max-w-xs">
          <strong>{email}</strong>으로 인증 메일을 보냈습니다.<br />
          링크를 클릭하면 가입이 완료됩니다.
        </p>
        <Link href="/login" className="mt-6 text-sm text-stone-600 hover:underline">
          로그인 페이지로
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-bold text-stone-800">The Untold</Link>
          <p className="text-sm text-stone-500 mt-2">새 계정을 만드세요</p>
        </div>

        <form onSubmit={handleSignup} className="bg-white rounded-2xl p-8 border border-stone-100 shadow-sm flex flex-col gap-4">
          {error && (
            <div className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">{error}</div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500">이름</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="홍길동"
            />
          </div>

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
              minLength={8}
              className="border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="8자 이상"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-stone-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-stone-700 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-sm text-stone-400 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-stone-700 font-semibold hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
