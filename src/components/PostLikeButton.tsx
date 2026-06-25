"use client";

import { useFormStatus } from "react-dom";
import { toggleProductLike } from "@/app/products/interactions";

function Btn({ liked, count }: { liked: boolean; count: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm transition-colors disabled:opacity-60 ${
        liked
          ? "border-hero-red/50 bg-hero-red/10 text-hero-red"
          : "border-border bg-surface text-muted hover:border-hero-red hover:text-hero-red"
      }`}
    >
      <span className="text-base">{liked ? "❤️" : "🤍"}</span>
      좋아요 <b>{count}</b>
    </button>
  );
}

export function PostLikeButton({
  productId,
  liked,
  count,
}: {
  productId: string;
  liked: boolean;
  count: number;
}) {
  return (
    <form action={toggleProductLike}>
      <input type="hidden" name="productId" value={productId} />
      <Btn liked={liked} count={count} />
    </form>
  );
}
