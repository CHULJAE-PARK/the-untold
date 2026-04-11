import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur border-b border-stone-100">
        <span className="text-lg font-bold tracking-tight text-stone-800">The Untold</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">
            로그인
          </Link>
          <Link href="/signup" className="text-sm bg-stone-900 text-white px-4 py-2 rounded-full hover:bg-stone-700 transition-colors">
            시작하기
          </Link>
        </div>
      </nav>

      <section className="flex flex-col items-center justify-center flex-1 text-center px-6 py-24 bg-gradient-to-b from-white to-stone-50">
        <p className="text-sm font-medium text-stone-400 mb-4 tracking-widest uppercase">Memorial Space</p>
        <h1 className="text-4xl md:text-6xl font-bold text-stone-900 leading-tight mb-6">
          내가 몰랐던<br />
          <span className="text-stone-400">그 사람의 이야기</span>
        </h1>
        <p className="text-lg text-stone-500 max-w-md mb-10 leading-relaxed">
          세상을 떠난 소중한 사람의 기억을 간직하고,
          함께 아는 이들과 나누는 온라인 추모 공간입니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/signup" className="bg-stone-900 text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-stone-700 transition-colors">
            추모 공간 만들기
          </Link>
          <Link href="#how" className="border border-stone-200 text-stone-600 px-8 py-3.5 rounded-full text-sm font-semibold hover:border-stone-400 transition-colors">
            어떻게 사용하나요?
          </Link>
        </div>
      </section>

      <section id="how" className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-stone-800 mb-14">이렇게 사용해요</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="flex flex-col gap-3">
              <span className="text-3xl font-black text-stone-200">01</span>
              <h3 className="text-lg font-bold text-stone-800">공간 만들기</h3>
              <p className="text-sm text-stone-500 leading-relaxed">고인의 이름과 사진, 생몰년도로 추모 페이지를 만드세요.</p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-3xl font-black text-stone-200">02</span>
              <h3 className="text-lg font-bold text-stone-800">사람들 초대하기</h3>
              <p className="text-sm text-stone-500 leading-relaxed">함께 그분을 기억하는 가족, 친구들을 초대하세요.</p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-3xl font-black text-stone-200">03</span>
              <h3 className="text-lg font-bold text-stone-800">이야기 남기기</h3>
              <p className="text-sm text-stone-500 leading-relaxed">사진, 영상, 글로 내가 몰랐던 그 사람의 이야기를 함께 채워가요.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-stone-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-stone-800 mb-14">주요 기능</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-100">
              <span className="text-2xl mb-3 block">🕯️</span>
              <h3 className="font-bold text-stone-800 mb-2">추모 공간</h3>
              <p className="text-sm text-stone-500 leading-relaxed">고인만을 위한 전용 페이지. 프로필 사진, 생애, 메시지를 담을 수 있어요.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-stone-100">
              <span className="text-2xl mb-3 block">📸</span>
              <h3 className="font-bold text-stone-800 mb-2">추억 갤러리</h3>
              <p className="text-sm text-stone-500 leading-relaxed">사진과 영상으로 소중한 순간들을 보존하세요.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-stone-100">
              <span className="text-2xl mb-3 block">✉️</span>
              <h3 className="font-bold text-stone-800 mb-2">디지털 유서</h3>
              <p className="text-sm text-stone-500 leading-relaxed">미래의 가족에게 남기는 메시지. 사망 확인 후 자동으로 전달됩니다.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-stone-100">
              <span className="text-2xl mb-3 block">🌍</span>
              <h3 className="font-bold text-stone-800 mb-2">다국어 지원</h3>
              <p className="text-sm text-stone-500 leading-relaxed">한국어, 영어, 일본어, 중국어, 스페인어로 이용 가능합니다.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-stone-900 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">지금 바로 시작하세요</h2>
        <p className="text-stone-400 mb-8 text-sm">기본 추모 공간은 영원히 무료입니다.</p>
        <Link href="/signup" className="bg-white text-stone-900 px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-stone-100 transition-colors">
          무료로 추모 공간 만들기
        </Link>
      </section>

      <footer className="py-8 px-6 bg-stone-900 border-t border-stone-800 text-center">
        <p className="text-xs text-stone-600">© 2025 The Untold. All rights reserved.</p>
      </footer>
    </main>
  );
}
