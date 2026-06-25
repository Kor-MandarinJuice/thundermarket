"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { login, signup, type AuthState } from "@/app/auth/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-thunder mt-2 w-full rounded-md py-3 text-base disabled:opacity-60"
    >
      {pending ? "출격 준비 중..." : label}
    </button>
  );
}

export function AuthForm({
  mode,
  notice,
}: {
  mode: "login" | "signup";
  notice?: string;
}) {
  const isSignup = mode === "signup";
  const action = isSignup ? signup : login;
  const [state, formAction] = useActionState<AuthState, FormData>(action, null);

  return (
    <div className="mx-auto w-full max-w-md px-5 py-14">
      <div className="mb-8 text-center">
        <div className="mb-3 text-4xl">⚡</div>
        <h1 className="font-display text-3xl tracking-wide">
          {isSignup ? (
            <>
              <span className="text-thunder-grad">천둥</span> 용사 등록
            </>
          ) : (
            <>
              다시 온 걸 환영한다, <span className="text-thunder-grad">용사여</span>
            </>
          )}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {isSignup
            ? "번개처럼 빠른 거래의 세계로 합류하라."
            : "로그인하고 거래를 이어가자."}
        </p>
      </div>

      {notice && (
        <p className="mb-5 rounded-md border border-electric/40 bg-electric/10 px-4 py-3 text-center text-sm text-electric">
          {notice}
        </p>
      )}

      <form action={formAction} className="card-mecha rounded-xl p-6">
        {isSignup && (
          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-muted">
              닉네임 (용사 코드네임)
            </span>
            <input
              name="nickname"
              type="text"
              required
              placeholder="예) 천둥용사다간"
              className="input-mecha w-full rounded-md px-4 py-3"
            />
          </label>
        )}

        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-medium text-muted">
            이메일
          </span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="thunder@market.com"
            className="input-mecha w-full rounded-md px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">
            비밀번호
          </span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder="6자 이상"
            className="input-mecha w-full rounded-md px-4 py-3"
          />
        </label>

        {state?.error && (
          <p className="mt-4 rounded-md border border-hero-red/40 bg-hero-red/10 px-3 py-2 text-sm text-hero-red">
            ⚠ {state.error}
          </p>
        )}

        <SubmitButton label={isSignup ? "용사 등록하기" : "로그인"} />
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isSignup ? (
          <>
            이미 용사로 등록했나?{" "}
            <Link href="/login" className="font-medium text-thunder hover:underline">
              로그인하기
            </Link>
          </>
        ) : (
          <>
            아직 용사가 아니라면?{" "}
            <Link href="/signup" className="font-medium text-thunder hover:underline">
              회원가입하기
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
