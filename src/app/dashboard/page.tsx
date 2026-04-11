import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: spaces } = await supabase
    .from('memorial_spaces')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-stone-50">
      {/* 헤더 */}
      <nav className="bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-stone-800">The Untold</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-stone-400">
            {user.user_metadata?.full_name || user.email}
          </span>
          <form action="/auth/signout" method="POST">
            <button className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
              로그아웃
            </button>
          </form>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">내 추모 공간</h1>
            <p className="text-sm text-stone-400 mt-1">총 {spaces?.length ?? 0}개의 공간</p>
          </div>
          <Link
            href="/create"
            className="bg-stone-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-stone-700 transition-colors"
          >
            + 새 추모 공간
          </Link>
        </div>

        {!spaces || spaces.length === 0 ? (
          <div className="text-center py-24 text-stone-400">
            <div className="text-4xl mb-4">🕯️</div>
            <p className="font-semibold text-stone-600 mb-2">아직 만든 추모 공간이 없습니다</p>
            <p className="text-sm mb-6">소중한 분의 이야기를 담을 공간을 만들어보세요.</p>
            <Link
              href="/create"
              className="bg-stone-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-stone-700 transition-colors"
            >
              첫 추모 공간 만들기
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {spaces.map((space) => (
              <Link
                key={space.id}
                href={`/memorial/${space.slug}`}
                className="bg-white rounded-2xl p-6 border border-stone-100 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-xl mb-4">
                  🕯️
                </div>
                <h3 className="font-bold text-stone-800 mb-1">{space.name}</h3>
                <p className="text-xs text-stone-400">
                  {space.birth_year && `${space.birth_year}`}
                  {space.birth_year && space.death_year && ' — '}
                  {space.death_year && `${space.death_year}`}
                </p>
                {space.bio && (
                  <p className="text-sm text-stone-500 mt-2 line-clamp-2">{space.bio}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
