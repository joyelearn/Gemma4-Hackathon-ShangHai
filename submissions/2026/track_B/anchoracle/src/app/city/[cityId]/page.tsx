import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Landmark, MessageCircle, Sparkles } from "lucide-react";
import { cities } from "@/data/characters";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ cityId: string }> }): Promise<Metadata> {
  const { cityId } = await params;
  const city = cities.find((c) => c.id === cityId);
  return { title: city ? city.name : "城市" };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ cityId: string }>;
}) {
  const { cityId } = await params;
  const city = cities.find((c) => c.id === cityId);
  if (!city) notFound();

  const landmarkCount = city.characters.reduce((sum, char) => sum + char.landmarks.length, 0);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07090f] text-white">
      <div className="soft-grid pointer-events-none absolute inset-0 opacity-60" />

      <section className="relative min-h-[360px] overflow-hidden">
        <img
          src={city.image}
          alt={city.name}
          className="absolute inset-0 h-full w-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090f] via-[#07090f]/60 to-[#07090f]/10" />
        <div className="relative mx-auto flex min-h-[360px] max-w-6xl flex-col justify-between px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white/65 backdrop-blur transition hover:border-white/25 hover:text-white"
          >
            <ArrowLeft size={16} />
            返回城市列表
          </Link>

          <div className="max-w-3xl pb-4">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-xs text-amber-100 backdrop-blur">
              <Sparkles size={14} />
              在地守护者已就位
            </div>
            <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">{city.name}</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/65">{city.description}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/55">
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 backdrop-blur">
                <MessageCircle size={16} />
                {city.characters.length} 位人物可对话
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 backdrop-blur">
                <Landmark size={16} />
                {landmarkCount} 处关联古迹
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">选择与你同行的人</h2>
            <p className="mt-2 text-sm text-white/45">每位人物会从自己的记忆和守护之地出发，回答旅行与故事。</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {city.characters.map((char) => (
            <Link
              key={char.id}
              href={`/chat/${char.id}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-amber-200/35 hover:bg-white/[0.07]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/45 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <img
                    src={char.avatar}
                    alt={char.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-white">{char.name}</h3>
                  <p className="mt-1 text-sm text-white/50">{char.title}</p>
                  <p className="mt-1 text-xs text-white/35">{char.era}</p>
                </div>
              </div>

              <p className="mt-5 min-h-20 text-sm leading-7 text-white/62">{char.intro}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {char.landmarks.map((lm) => (
                  <span
                    key={lm.name}
                    className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/45 transition group-hover:border-cyan-200/25 group-hover:text-cyan-100"
                  >
                    {lm.name}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                <span className="text-white/40">开始对话</span>
                <ArrowRight size={16} className="text-white/30 transition group-hover:translate-x-1 group-hover:text-amber-100" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
