'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 7);
}

export default function CreatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [deathYear, setDeathYear] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (loading) return null;
  if (!user) { router.push('/login'); return null; }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('이름을 입력하세요.'); return; }
    setSaving(true);
    try {
      const slug = toSlug(name.trim());
      await addDoc(collection(db, 'memorial_spaces'), {
        created_by: user!.uid,
        name: name.trim(),
        slug,
        birth_year: birthYear ? parseInt(birthYear) : null,
        death_year: deathYear ? parseInt(deathYear) : null,
        bio: bio.trim() || null,
        is_public: true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      router.push('/dashboard');
    } catch {
      setError('저장 중 오류가 발생했습니다.');
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-base font-bold text-gray-900">The Untold</Link>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← 대시보드</Link>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">새 공간 만들기</h1>
          <p className="text-sm text-gray-500">소중한 분을 기억하는 공간을 만들어보세요.</p>
        </div>

        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col gap-5">
          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</div>}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">이름 *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
              placeholder="고인의 이름" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">출생 연도</label>
              <input type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                placeholder="예: 1945" min="1800" max="2100" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">별세 연도</label>
              <input type="number" value={deathYear} onChange={e => setDeathYear(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                placeholder="예: 2023" min="1800" max="2100" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">소개 (선택)</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white resize-none"
              placeholder="고인에 대한 짧은 소개를 적어주세요..." />
          </div>

          <button type="submit" disabled={saving}
            className="bg-gray-900 text-white py-3 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 mt-2">
            {saving ? '만드는 중...' : '공간 만들기'}
          </button>
        </form>
      </div>
    </div>
  );
}
