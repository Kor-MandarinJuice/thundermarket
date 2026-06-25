"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string } | null;

// 회원가입
export async function signup(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nickname = String(formData.get("nickname") ?? "").trim();

  if (!email || !password || !nickname) {
    return { error: "모든 항목을 입력해줘!" };
  }
  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 해." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nickname }, // user_metadata에 닉네임 저장
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");

  // 이메일 인증이 켜져 있으면 session이 null로 옴 → 메일 확인 안내로 이동
  if (!data.session) {
    redirect("/login?confirm=1");
  }

  // 이메일 인증이 꺼져 있으면 바로 로그인됨 → 홈으로
  redirect("/?welcome=1");
}

// 로그인
export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해줘!" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "이메일 또는 비밀번호가 올바르지 않아." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

// 로그아웃
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
