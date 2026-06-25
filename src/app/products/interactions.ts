"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function nicknameOf(user: {
  user_metadata?: { nickname?: unknown };
  email?: string;
}): string {
  return (
    (user.user_metadata?.nickname as string | undefined) ??
    user.email?.split("@")[0] ??
    "익명 용사"
  );
}

// 게시물 좋아요 토글 (누르면 추가/취소)
export async function toggleProductLike(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/products/${productId}`);

  const { data: existing } = await supabase
    .from("product_likes")
    .select("user_id")
    .eq("product_id", productId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("product_likes")
      .delete()
      .eq("product_id", productId)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("product_likes")
      .insert({ product_id: productId, user_id: user.id });
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
}

// 댓글 / 대댓글 작성
export async function addComment(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const parentId = String(formData.get("parentId") ?? "") || null;
  const content = String(formData.get("content") ?? "").trim();
  if (!productId || !content) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/products/${productId}`);

  await supabase.from("comments").insert({
    product_id: productId,
    parent_id: parentId,
    user_id: user.id,
    author_nickname: nicknameOf(user),
    content: content.slice(0, 1000),
  });

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
}

// 댓글 삭제 (본인만)
export async function deleteComment(formData: FormData) {
  const commentId = String(formData.get("commentId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!commentId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  revalidatePath("/products");
  if (productId) revalidatePath(`/products/${productId}`);
}

// 댓글 좋아요/싫어요 (같은 걸 다시 누르면 취소, 반대면 변경)
export async function setCommentReaction(formData: FormData) {
  const commentId = String(formData.get("commentId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const reaction = String(formData.get("reaction") ?? "");
  if (!commentId || (reaction !== "like" && reaction !== "dislike")) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/products/${productId}`);

  const { data: existing } = await supabase
    .from("comment_reactions")
    .select("reaction")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    // 없으면 추가
    await supabase
      .from("comment_reactions")
      .insert({ comment_id: commentId, user_id: user.id, reaction });
  } else if (existing.reaction === reaction) {
    // 같은 걸 또 누르면 취소
    await supabase
      .from("comment_reactions")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);
  } else {
    // 반대 반응으로 변경
    await supabase
      .from("comment_reactions")
      .update({ reaction })
      .eq("comment_id", commentId)
      .eq("user_id", user.id);
  }

  if (productId) revalidatePath(`/products/${productId}`);
}
