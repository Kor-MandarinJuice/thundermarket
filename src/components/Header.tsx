import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nickname =
    (user?.user_metadata?.nickname as string | undefined) ??
    user?.email?.split("@")[0];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[#0a0e1a]/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="font-display text-xl tracking-wide text-thunder-grad">
            천둥마켓
          </span>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden text-muted sm:inline">
                <b className="text-foreground">{nickname}</b> 용사님
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-md border border-border px-3 py-1.5 text-muted transition-colors hover:border-hero-red hover:text-hero-red"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-muted transition-colors hover:text-foreground"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="btn-thunder rounded-md px-4 py-1.5 text-sm"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
