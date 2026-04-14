'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { getMyMemberSpaceIds, getPendingRequestCount } from '@/lib/db';

interface MemorialSpace {
  id: string;
  name: string;
  slug: string;
  birth_year?: number;
  death_year?: number;
  bio?: string;
  created_by: string;
  is_deleted?: boolean;
  photo_url?: string;
}

interface SpaceWithBadge extends MemorialSpace {
  pendingCount: number;
  myRole: 'owner' | 'member';
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [spaces, setSpaces] = useState<SpaceWithBadge[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      // 내가 멤버인 공간 ID (collectionGroup, uid 필드 있는 것 — 구형 데이터는 없을 수 있음)
      const memberSpaceIds = await getMyMemberSpaceIds(user!.uid).catch(() => [] as string[]);

      // 내가 만든 공간 ID (uid 필드 없는 기존 데이터 fallback)
      const ownedSnap = await getDocs(query(
        collection(db, 'memorial_spaces'),
        where('created_by', '==', user!.uid)
      ));
      const ownedIds = ownedSnap.docs.map(d => d.id);

      // 중복 없이 합치기
      const allIds = Array.from(new Set([...memberSpaceIds, ...ownedIds]));
      if (allIds.length === 0) { setFetching(false); return; }

      // 각 공간 문서 조회
      const spaceDocs = await Promise.all(allIds.map(id => getDoc(doc(db, 'memorial_spaces', id))));
      const rawSpaces = spaceDocs
        .filter(d => d.exists() && !d.data()?.is_deleted)
        .map(d => ({ id: d.id, ...d.data() } as MemorialSpace));

      // 각 공간에 대해 pending count + role 조회
      const withBadges = await Promise.all(rawSpaces.map(async space => {
        const isOwner = space.created_by === user!.uid;
        const pendingCount = isOwner ? await getPendingRequestCount(space.id) : 0;
        return { ...space, pendingCount, myRole: isOwner ? 'owner' : 'member' } as SpaceWithBadge;
      }));

      // 내 공간(owner) 먼저, 그 다음 참여 공간(member) 순 정렬
      withBadges.sort((a, b) => {
        if (a.myRole === b.myRole) return 0;
        return a.myRole === 'owner' ? -1 : 1;
      });

      setSpaces(withBadges);
      setFetching(false);
    }
    load();
  }, [user]);

  if (loading || fetching) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">불러오는 중...</div>;
  }

  const mySpaces = spaces.filter(s => s.myRole === 'owner');
  const joinedSpaces = spaces.filter(s => s.myRole === 'member');

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

      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-10">

        {/* 내가 만든 공간 */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900">내 공간</h1>
              <p className="text-sm text-gray-400 mt-0.5">총 {mySpaces.length}개</p>
            </div>
            <Link href="/create"
              className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors">
              + 새 공간
            </Link>
          </div>

          {mySpaces.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
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
              {mySpaces.map(space => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          )}
        </section>

        {/* 참여 중인 공간 */}
        {joinedSpaces.length > 0 && (
          <section>
            <div className="mb-5">
              <h2 className="text-base font-bold text-gray-900">참여 중인 공간</h2>
              <p className="text-sm text-gray-400 mt-0.5">총 {joinedSpaces.length}개</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {joinedSpaces.map(space => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SpaceCard({ space }: { space: SpaceWithBadge }) {
  return (
    <Link href={`/memorial/${space.slug}`}
      className="relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all block">
      {space.pendingCount > 0 && (
        <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {space.pendingCount}
        </span>
      )}
      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-lg mb-4 border border-gray-200">
        {space.photo_url
          ? <img src={space.photo_url} alt="" className="w-full h-full object-cover" />
          : '🕊️'
        }
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 pr-6">{space.name}</h3>
      <p className="text-xs text-gray-400">
        {space.birth_year}{space.birth_year && space.death_year && ' — '}{space.death_year}
      </p>
      {space.bio && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{space.bio}</p>}
    </Link>
  );
}
