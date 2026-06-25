import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteProduct } from "@/app/products/actions";
import { ProductGallery } from "@/components/ProductGallery";
import { PostLikeButton } from "@/components/PostLikeButton";
import { CommentsSection } from "@/components/CommentsSection";
import {
  formatPrice,
  statusLabel,
  timeAgo,
  type Product,
} from "@/lib/products";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) {
    notFound();
  }

  const p = product as Product;
  const isOwner = user?.id === p.seller_id;

  // 좋아요 개수 + 내가 눌렀는지
  const { count: likeCount } = await supabase
    .from("product_likes")
    .select("*", { count: "exact", head: true })
    .eq("product_id", id);

  let userLiked = false;
  if (user) {
    const { data: myLike } = await supabase
      .from("product_likes")
      .select("user_id")
      .eq("product_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    userLiked = !!myLike;
  }

  const statusStyle =
    p.status === "sold"
      ? "border-border bg-surface-2 text-muted"
      : p.status === "reserved"
        ? "border-electric/40 bg-electric/10 text-electric"
        : "border-thunder/40 bg-thunder/10 text-thunder";

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-12">
      <Link
        href="/products"
        className="mb-6 inline-block text-sm text-muted transition-colors hover:text-foreground"
      >
        ← 목록으로
      </Link>

      <article className="card-mecha rounded-xl p-7">
        <div className="mb-6">
          <ProductGallery images={p.image_urls ?? []} title={p.title} />
        </div>

        <div className="mb-4 flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl leading-snug tracking-wide">
            {p.title}
          </h1>
          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-xs ${statusStyle}`}
          >
            {statusLabel(p.status)}
          </span>
        </div>

        <p className="font-display text-3xl text-thunder">
          {formatPrice(p.price)}
        </p>

        <div className="mt-4 flex items-center gap-2 border-b border-border pb-5 text-sm text-muted">
          <span className="text-lg">🛡</span>
          <b className="text-foreground">{p.seller_nickname}</b> 용사
          <span className="mx-1">·</span>
          {timeAgo(p.created_at)}
        </div>

        <div className="mt-5 whitespace-pre-wrap break-words leading-7 text-foreground/90">
          {p.description || "상세 설명이 없어요."}
        </div>
      </article>

      <div className="mt-5 flex justify-center">
        <PostLikeButton
          productId={p.id}
          liked={userLiked}
          count={likeCount ?? 0}
        />
      </div>

      {isOwner && (
        <div className="mt-5 flex gap-3">
          <Link
            href={`/products/${p.id}/edit`}
            className="flex-1 rounded-md border border-border bg-surface px-4 py-3 text-center text-sm transition-colors hover:border-thunder"
          >
            수정하기
          </Link>
          <form action={deleteProduct} className="flex-1">
            <input type="hidden" name="id" value={p.id} />
            <button
              type="submit"
              className="w-full rounded-md border border-hero-red/40 bg-hero-red/10 px-4 py-3 text-sm text-hero-red transition-colors hover:bg-hero-red/20"
            >
              삭제하기
            </button>
          </form>
        </div>
      )}

      <CommentsSection productId={p.id} />
    </div>
  );
}
