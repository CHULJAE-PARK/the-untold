import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <span className="text-base font-bold tracking-tight text-gray-900">The Untold</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            로그인
          </Link>
          <Link href="/signup" className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium">
            시작하기
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 text-center px-6 py-28 bg-white">
        <p className="text-xs font-semibold text-gray-400 mb-5 tracking-widest uppercase">Memory · Story · Legacy</p>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          내가 몰랐던<br />
          그 사람의 이야기
        </h1>
        <p className="text-base text-gray-500 max-w-md mb-10 leading-relaxed">
          소중한 사람의 삶과 기억을 기록하고,
          함께 아는 이들과 나누는 공간입니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/signup" className="bg-gray-900 text-white px-8 py-3 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors">
            공간 만들기
          </Link>
          <Link href="#how" className="border border-gray-200 text-gray-700 bg-white px-8 py-3 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
            어떻게 사용하나요?
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-center text-gray-900 mb-14">이렇게 사용해요</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="flex flex-col gap-3">
              <span className="text-4xl font-black text-gray-100">01</span>
              <h3 className="text-base font-bold text-gray-900">공간 만들기</h3>
              <p className="text-sm text-gray-500 leading-relaxed">이름, 사진, 생몰년도로 전용 페이지를 만드세요.</p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-4xl font-black text-gray-100">02</span>
              <h3 className="text-base font-bold text-gray-900">사람들 초대하기</h3>
              <p className="text-sm text-gray-500 leading-relaxed">함께 기억하는 가족, 친구들을 초대하세요.</p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-4xl font-black text-gray-100">03</span>
              <h3 className="text-base font-bold text-gray-900">이야기 채우기</h3>
              <p className="text-sm text-gray-500 leading-relaxed">사진, 영상, 글로 내가 몰랐던 이야기를 함께 채워가요.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-center text-gray-900 mb-14">주요 기능</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-6 border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-sm transition-all">
              <span className="text-xl mb-3 block">📖</span>
              <h3 className="font-semibold text-gray-900 mb-2">전용 추모 공간</h3>
              <p className="text-sm text-gray-500 leading-relaxed">고인만을 위한 페이지. 프로필, 생애, 메시지를 담을 수 있어요.</p>
            </div>
            <div className="p-6 border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-sm transition-all">
              <span className="text-xl mb-3 block">📸</span>
              <h3 className="font-semibold text-gray-900 mb-2">추억 갤러리</h3>
              <p className="text-sm text-gray-500 leading-relaxed">사진과 영상으로 소중한 순간들을 영원히 보존하세요.</p>
            </div>
            <div className="p-6 border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-sm transition-all">
              <span className="text-xl mb-3 block">✉️</span>
              <h3 className="font-semibold text-gray-900 mb-2">디지털 유서</h3>
              <p className="text-sm text-gray-500 leading-relaxed">미래의 가족에게 남기는 메시지. 때가 되면 자동으로 전달됩니다.</p>
            </div>
            <div className="p-6 border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-sm transition-all">
              <span className="text-xl mb-3 block">🌍</span>
              <h3 className="font-semibold text-gray-900 mb-2">다국어 지원</h3>
              <p className="text-sm text-gray-500 leading-relaxed">한국어, 영어, 일본어, 중국어, 스페인어로 이용 가능합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center bg-gray-900">
        <h2 className="text-xl font-bold text-white mb-3">지금 바로 시작하세요</h2>
        <p className="text-gray-400 mb-8 text-sm">기본 공간은 영원히 무료입니다.</p>
        <Link href="/signup" className="bg-white text-gray-900 px-8 py-3 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors">
          무료로 시작하기
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-900 border-t border-gray-800 text-center">
        <p className="text-xs text-gray-600">© 2025 The Untold. All rights reserved.</p>
      </footer>
    </main>
  );
}
