import Link from "next/link";
import { ArrowRight, Camera, MapPin, MessageCircle, ScanLine, Sparkles } from "lucide-react";
import { cities } from "@/data/characters";

export default function Home() {
  const totalCharacters = cities.reduce((sum, city) => sum + city.characters.length, 0);
  const totalLandmarks = cities.reduce(
    (sum, city) => sum + city.characters.reduce((n, char) => n + char.landmarks.length, 0),
    0
  );
  const heroCity = cities[0];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07090f] text-white">
      <div className="soft-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.20),transparent_62%)]" />

      <section className="relative mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300/30 bg-amber-300/10 text-amber-200">
              <Sparkles size={18} />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide">Anchoracle</span>
              <span className="block text-xs text-white/45">与故人同行</span>
            </span>
          </Link>
          <Link
            href="/scan"
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-2 text-xs text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/15 sm:gap-2 sm:px-3 sm:text-sm"
          >
            <ScanLine size={16} />
            <span className="hidden sm:inline">拍照识古迹</span>
            <span className="sm:hidden">识别</span>
          </Link>
        </nav>

        <div className="grid min-h-[520px] items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/65 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.9)]" />
              文化旅行 AI 导游
            </div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-6xl">
              和一座城的旧时光，
              <span className="block bg-gradient-to-r from-amber-200 via-white to-cyan-100 bg-clip-text text-transparent">
                当面说话。
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/60 sm:text-lg">
              <span className="block">选择城市，或直接拍下一处古迹。</span>
              <span className="block">让历史人物讲清来历、路线、门票、周边与游览建议。</span>
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#cities"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-200 px-5 py-3 text-sm font-semibold text-stone-950 shadow-[0_18px_60px_rgba(245,158,11,0.22)] transition hover:bg-amber-100"
              >
                <MapPin size={18} />
                选择城市开始
              </a>
              <Link
                href="/scan"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/80 backdrop-blur transition hover:border-white/25 hover:bg-white/[0.08]"
              >
                <Camera size={17} />
                或拍照识别古迹
              </Link>
            </div>
            <div className="mt-8 grid max-w-md grid-cols-1 gap-3 text-center sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 backdrop-blur">
                <div className="text-xl font-semibold text-white">{cities.length}</div>
                <div className="mt-1 text-xs text-white/45">座城市</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 backdrop-blur">
                <div className="text-xl font-semibold text-white">{totalCharacters}</div>
                <div className="mt-1 text-xs text-white/45">位人物</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 backdrop-blur">
                <div className="text-xl font-semibold text-white">{totalLandmarks}</div>
                <div className="mt-1 text-xs text-white/45">处古迹</div>
              </div>
            </div>
          </div>

          <Link
            href={`/city/${heroCity.id}`}
            className="group relative min-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30"
          >
            <img
              src={heroCity.image}
              alt={heroCity.name}
              className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090f] via-[#07090f]/35 to-transparent" />
            <div className="absolute inset-x-6 top-6 flex items-center justify-between">
              <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70 backdrop-blur">
                推荐城市
              </span>
              <span className="rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1 text-xs text-amber-100 backdrop-blur">
                {heroCity.characters.length} 位守护者
              </span>
            </div>
            <div className="absolute inset-x-6 bottom-6">
              <div className="mb-4 flex -space-x-3">
                {heroCity.characters.map((char) => (
                  <img
                    key={char.id}
                    src={char.avatar}
                    alt={char.name}
                    className="h-11 w-11 rounded-full border-2 border-[#07090f] object-cover"
                  />
                ))}
              </div>
              <h2 className="text-4xl font-semibold">{heroCity.name}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/65">{heroCity.description}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm text-amber-100">
                进入人物列表
                <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section id="cities" className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">选择一座城市</h2>
            <p className="mt-2 text-sm text-white/45">从城市进入人物对话，或用扫描直接唤起相关人物。</p>
          </div>
          <MapPin className="hidden text-white/25 sm:block" size={22} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.filter((c) => c.id !== heroCity.id).map((city) => (
            <Link
              key={city.id}
              href={`/city/${city.id}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-amber-200/35 hover:bg-white/[0.07]"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={city.image}
                  alt={city.name}
                  className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07090f] via-[#07090f]/30 to-transparent" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{city.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-white/50">{city.description}</p>
                  </div>
                  <ArrowRight size={18} className="mt-1 text-white/25 transition group-hover:translate-x-1 group-hover:text-amber-100" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {city.characters.map((char) => (
                      <img
                        key={char.id}
                        src={char.avatar}
                        alt={char.name}
                        className="h-8 w-8 rounded-full border-2 border-[#10120f] object-cover"
                      />
                    ))}
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/45">
                    <MessageCircle size={13} />
                    {city.characters.length} 位可对话
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="relative border-t border-white/8 py-8 text-center text-xs leading-6 text-white/30">
        <p>Anchoracle——与故人同行 · Powered by Gemma 4</p>
        <p className="mt-1">Gemma4开发者大赛作品</p>
      </footer>
    </main>
  );
}
