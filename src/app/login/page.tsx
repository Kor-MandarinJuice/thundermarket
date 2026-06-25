import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirm?: string; next?: string }>;
}) {
  const { confirm, next } = await searchParams;

  // 이미 로그인한 경우 홈으로
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <AuthForm
      mode="login"
      next={next}
      notice={
        confirm
          ? "📧 가입 확인 메일을 보냈어! 메일의 링크를 누른 뒤 로그인해줘."
          : undefined
      }
    />
  );
}
