"use client";

import { useState } from "react";
import { timeAgo } from "@/lib/products";
import {
  deleteComment,
  setCommentReaction,
} from "@/app/products/interactions";
import { CommentForm } from "@/components/CommentForm";

export type CommentNode = {
  id: string;
  parent_id: string | null;
  user_id: string;
  author_nickname: string;
  content: string;
  created_at: string;
  likeCount: number;
  dislikeCount: number;
  myReaction: "like" | "dislike" | null;
  children: CommentNode[];
};

export function CommentItem({
  comment,
  productId,
  currentUserId,
  depth = 0,
}: {
  comment: CommentNode;
  productId: string;
  currentUserId: string | null;
  depth?: number;
}) {
  const [showReply, setShowReply] = useState(false);
  const isOwner = currentUserId === comment.user_id;
  // 너무 깊어지지 않게 들여쓰기는 4단계까지만
  const indent = depth > 0 ? "ml-4 border-l border-border pl-4 sm:ml-6" : "";

  return (
    <div className={indent}>
      <div className="py-3">
        <div className="mb-1 flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground">
            🛡 {comment.author_nickname}
          </span>
          <span className="text-xs text-muted">
            {timeAgo(comment.created_at)}
          </span>
        </div>

        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">
          {comment.content}
        </p>

        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {/* 좋아요 */}
          <form action={setCommentReaction}>
            <input type="hidden" name="commentId" value={comment.id} />
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="reaction" value="like" />
            <button
              type="submit"
              className={`rounded-full border px-2 py-1 transition-colors ${
                comment.myReaction === "like"
                  ? "border-thunder/50 bg-thunder/10 text-thunder"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              👍 {comment.likeCount}
            </button>
          </form>

          {/* 싫어요 */}
          <form action={setCommentReaction}>
            <input type="hidden" name="commentId" value={comment.id} />
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="reaction" value="dislike" />
            <button
              type="submit"
              className={`rounded-full border px-2 py-1 transition-colors ${
                comment.myReaction === "dislike"
                  ? "border-hero-red/50 bg-hero-red/10 text-hero-red"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              👎 {comment.dislikeCount}
            </button>
          </form>

          {/* 답글 */}
          <button
            type="button"
            onClick={() => setShowReply((v) => !v)}
            className="rounded-full border border-border px-2 py-1 text-muted transition-colors hover:text-foreground"
          >
            💬 답글
          </button>

          {/* 삭제 (본인만) */}
          {isOwner && (
            <form action={deleteComment}>
              <input type="hidden" name="commentId" value={comment.id} />
              <input type="hidden" name="productId" value={productId} />
              <button
                type="submit"
                className="rounded-full border border-border px-2 py-1 text-muted transition-colors hover:border-hero-red hover:text-hero-red"
              >
                삭제
              </button>
            </form>
          )}
        </div>

        {showReply && (
          <div className="mt-3">
            <CommentForm
              productId={productId}
              parentId={comment.id}
              placeholder="답글을 남겨보세요"
              submitLabel="답글"
              autoFocus
              onDone={() => setShowReply(false)}
            />
          </div>
        )}
      </div>

      {comment.children.length > 0 && (
        <div>
          {comment.children.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              productId={productId}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
