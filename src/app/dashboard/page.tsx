'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';

interface MemorialSpace {
  id: string;
  name: string;
  slug: string;
  birth_year?: number;
  death_year?: number;
  bio?: string;
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [spaces, setSpaces] = useState<MemorialSpace[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'memorial_spaces'),
      where('created_by', '==', user.uid),
      orderBy('created_at', 'desc')
    );
    getDocs(q).then(snap => {
      setSpaces(snap.docs.map(d => ({ id: d.id, ...d.data() } as MemorialSpace)));
      setFetching(false);
    });
  }, [user]);

  if (loading || fetching) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">불러오는 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-base font-bold text-gray-900">The Untold</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user?.displayName || user?.email}</span>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
            로그아웃
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">내 공간</h1>
            <p className="text-sm text-gray-400 mt-1">총 {spaces.length}개</p>
          </div>
          <Link href="/create"
            className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors">
            + 새 공간
          </Link>
        </div>

        {spaces.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-4xl mb-4">📖</div>
            <p className="font-semibold text-gray-700 mb-2">아직 만든 공간이 없습니다</p>
            <p className="text-sm mb-6">소중한 분의 이야기를 담을 공간을 만들어보세요.</p>
            <Link href="/create"
              className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors">
              첫 공간 만들기
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaces.map(space => (
              <Link key={space.id} href={`/memorial/${space.slug}`}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg mb-4">📖</div>
                <h3 className="font-semibold text-gray-900 mb-1">{space.name}</h3>
                <p className="text-xs text-gray-400">
                  {space.birth_year}{space.birth_year && space.death_year && ' — '}{space.death_year}
                </p>
                {space.bio && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{space.bio}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
