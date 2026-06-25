import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nickname =
    (user?.user_metadata?.nickname as string | undefined) ??
    user?.email?.split("@")[0];

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-16">
      {welcome && (
        <div className="mb-10 rounded-lg border border-thunder/40 bg-thunder/10 px-5 py-3 text-center text-sm text-thunder">
          ⚡ 용사 등록 완료! 천둥마켓에 합류한 걸 환영한다.
        </div>
      )}

      <section className="flex flex-col items-center text-center">
        <span className="mb-6 inline-block rounded-full border border-border bg-surface px-4 py-1 text-xs tracking-widest text-muted">
          우리 동네 번개 거래 마켓
        </span>

        <h1 className="font-display text-5xl leading-tight tracking-wide sm:text-6xl">
          번개처럼 사고
          <br />
          <span className="text-thunder-grad">천둥처럼 팔아라</span>
        </h1>

        <p className="mt-6 max-w-md text-base leading-7 text-muted">
          전설의 중고거래 마켓, <b className="text-foreground">천둥마켓</b>.
          <br />
          이웃과 번개처럼 빠른 거래를 시작하세요.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          {user ? (
            <>
              <span className="flex items-center rounded-md border border-border bg-surface px-5 py-3 text-sm">
                ⚡ <b className="mx-1 text-thunder">{nickname}</b> 용사님, 출격
                준비 완료!
              </span>
              <Link
                href="/products"
                className="btn-thunder rounded-md px-6 py-3 text-center text-sm"
              >
                상품 둘러보기
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/signup"
                className="btn-thunder rounded-md px-7 py-3 text-center"
              >
                지금 시작하기
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-border bg-surface px-7 py-3 text-center text-sm transition-colors hover:border-thunder"
              >
                로그인
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-3">
        {[
          { icon: "⚡", title: "번개 거래", desc: "근처 이웃과 빠르게 사고 팔기" },
          { icon: "🛡", title: "안전한 거래", desc: "용사 인증으로 믿을 수 있는 거래" },
          { icon: "🔥", title: "동네 기반", desc: "우리 동네 중심의 중고 마켓" },
        ].map((f) => (
          <div key={f.title} className="card-mecha rounded-xl p-6">
            <div className="mb-3 text-2xl">{f.icon}</div>
            <h3 className="font-display text-lg tracking-wide">{f.title}</h3>
            <p className="mt-1 text-sm text-muted">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
