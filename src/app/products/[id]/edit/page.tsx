import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/ProductForm";
import { updateProduct } from "@/app/products/actions";
import type { Product } from "@/lib/products";

export const metadata = {
  title: "판매글 수정 · 천둥마켓",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/products/${id}/edit`);
  }

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) {
    notFound();
  }

  const p = product as Product;

  // 남의 글은 수정 못 하게 상세로 돌려보냄
  if (p.seller_id !== user.id) {
    redirect(`/products/${id}`);
  }

  // updateProduct(id, prevState, formData) 에서 id를 미리 채워줌
  const action = updateProduct.bind(null, id);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-12">
      <div className="mb-6">
        <h1 className="font-display text-3xl tracking-wide">
          <span className="text-thunder-grad">판매글</span> 수정
        </h1>
        <p className="mt-1 text-sm text-muted">내용을 고치고 저장하자.</p>
      </div>

      <ProductForm action={action} product={p} submitLabel="수정 저장" />
    </div>
  );
}
