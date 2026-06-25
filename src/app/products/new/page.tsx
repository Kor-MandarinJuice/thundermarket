import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/ProductForm";
import { createProduct } from "@/app/products/actions";

export const metadata = {
  title: "판매글 작성 · 천둥마켓",
};

export default async function NewProductPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인 안 했으면 로그인 화면으로
  if (!user) {
    redirect("/login?next=/products/new");
  }

  const nickname =
    (user.user_metadata?.nickname as string | undefined) ??
    user.email?.split("@")[0] ??
    "익명 용사";

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-12">
      <div className="mb-6">
        <h1 className="font-display text-3xl tracking-wide">
          <span className="text-thunder-grad">판매글</span> 작성
        </h1>
        <p className="mt-1 text-sm text-muted">
          번개처럼 빠르게 거래를 시작하자.
        </p>
      </div>

      <ProductForm
        action={createProduct}
        submitLabel="등록하기"
        nickname={nickname}
      />
    </div>
  );
}
