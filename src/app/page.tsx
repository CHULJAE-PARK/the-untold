import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur border-b border-amber-100 sticky top-0 z-10">
        <span className="text-lg font-bold tracking-tight text-amber-900">The Untold</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-stone-500 hover:text-amber-700 transition-colors">
            로그인
          </Link>
          <Link href="/signup" className="text-sm bg-amber-500 text-white px-4 py-2 rounded-full hover:bg-amber-600 transition-colors font-medium">
            시작하기
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 text-center px-6 py-24 bg-gradient-to-b from-amber-50 via-orange-50/40 to-white">
        <p className="text-sm font-medium text-amber-500 mb-4 tracking-widest uppercase">A Place of Warm Memories</p>
        <h1 className="text-4xl md:text-6xl font-bold text-stone-800 leading-tight mb-6">
          내가 몰랐던<br />
          <span className="text-amber-500">그 사람의 이야기</span>
        </h1>
        <p className="text-lg text-stone-500 max-w-md mb-10 leading-relaxed">
          소중한 사람의 삶과 기억을 따뜻하게 간직하고,
          함께 아는 이들과 나누는 온라인 추모 공간입니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/signup" className="bg-amber-500 text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm shadow-amber-200">
            추모 공간 만들기
          </Link>
          <Link href="#how" className="border border-amber-200 text-amber-700 bg-white px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-amber-50 transition-colors">
            어떻게 사용하나요?
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-stone-800 mb-14">이렇게 사용해요</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="flex flex-col gap-3">
              <span className="text-3xl font-black text-amber-100">01</span>
              <h3 className="text-lg font-bold text-stone-800">공간 만들기</h3>
              <p className="text-sm text-stone-500 leading-relaxed">고인의 이름과 사진, 생몰년도로 따뜻한 추모 페이지를 만드세요.</p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-3xl font-black text-amber-100">02</span>
              <h3 className="text-lg font-bold text-stone-800">사람들 초대하기</h3>
              <p className="text-sm text-stone-500 leading-relaxed">함께 그분을 기억하는 가족, 친구들을 초대하세요.</p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-3xl font-black text-amber-100">03</span>
              <h3 className="text-lg font-bold text-stone-800">이야기 채우기</h3>
              <p className="text-sm text-stone-500 leading-relaxed">사진, 영상, 글로 내가 몰랐던 그 사람의 이야기를 함께 채워가요.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-amber-50/60">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-stone-800 mb-14">주요 기능</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-amber-100 hover:shadow-md hover:shadow-amber-100 transition-shadow">
              <span className="text-2xl mb-3 block">🌿</span>
              <h3 className="font-bold text-stone-800 mb-2">추모 공간</h3>
              <p className="text-sm text-stone-500 leading-relaxed">고인만을 위한 전용 페이지. 프로필 사진, 생애, 메시지를 담을 수 있어요.</p>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-amber-100 hover:shadow-md hover:shadow-amber-100 transition-shadow">
              <span className="text-2xl mb-3 block">📸</span>
              <h3 className="font-bold text-stone-800 mb-2">추억 갤러리</h3>
              <p className="text-sm text-stone-500 leading-relaxed">사진과 영상으로 소중한 순간들을 영원히 보존하세요.</p>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-amber-100 hover:shadow-md hover:shadow-amber-100 transition-shadow">
              <span className="text-2xl mb-3 block">✉️</span>
              <h3 className="font-bold text-stone-800 mb-2">디지털 유서</h3>
              <p className="text-sm text-stone-500 leading-relaxed">미래의 가족에게 남기는 메시지. 사망 확인 후 자동으로 전달됩니다.</p>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-amber-100 hover:shadow-md hover:shadow-amber-100 transition-shadow">
              <span className="text-2xl mb-3 block">🌍</span>
              <h3 className="font-bold text-stone-800 mb-2">다국어 지원</h3>
              <p className="text-sm text-stone-500 leading-relaxed">한국어, 영어, 일본어, 중국어, 스페인어로 이용 가능합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center bg-gradient-to-br from-amber-400 to-orange-400">
        <h2 className="text-2xl font-bold text-white mb-4">지금 바로 시작하세요</h2>
        <p className="text-amber-100 mb-8 text-sm">기본 추모 공간은 영원히 무료입니다.</p>
        <Link href="/signup" className="bg-white text-amber-700 px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-amber-50 transition-colors shadow-md">
          무료로 추모 공간 만들기
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-stone-800 text-center">
        <p className="text-xs text-stone-500">© 2025 The Untold. All rights reserved.</p>
      </footer>
    </main>
  );
}
