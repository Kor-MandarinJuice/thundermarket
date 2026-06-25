import { createClient } from "@/lib/supabase/server";
import { CommentForm } from "@/components/CommentForm";
import { CommentItem, type CommentNode } from "@/components/CommentItem";

type CommentRow = {
  id: string;
  parent_id: string | null;
  user_id: string;
  author_nickname: string;
  content: string;
  created_at: string;
};

type ReactionRow = {
  comment_id: string;
  user_id: string;
  reaction: "like" | "dislike";
};

export async function CommentsSection({ productId }: { productId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: commentRows } = await supabase
    .from("comments")
    .select("id, parent_id, user_id, author_nickname, content, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  const rows = (commentRows ?? []) as CommentRow[];

  // 댓글들의 좋아요/싫어요 모아서 집계
  const ids = rows.map((r) => r.id);
  let reactions: ReactionRow[] = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("comment_reactions")
      .select("comment_id, user_id, reaction")
      .in("comment_id", ids);
    reactions = (data ?? []) as ReactionRow[];
  }

  // 댓글별 집계 + 내 반응
  const stats = new Map<
    string,
    { likeCount: number; dislikeCount: number; myReaction: "like" | "dislike" | null }
  >();
  for (const id of ids) {
    stats.set(id, { likeCount: 0, dislikeCount: 0, myReaction: null });
  }
  for (const r of reactions) {
    const s = stats.get(r.comment_id);
    if (!s) continue;
    if (r.reaction === "like") s.likeCount += 1;
    else s.dislikeCount += 1;
    if (user && r.user_id === user.id) s.myReaction = r.reaction;
  }

  // 트리 만들기
  const nodes = new Map<string, CommentNode>();
  for (const r of rows) {
    const s = stats.get(r.id)!;
    nodes.set(r.id, {
      ...r,
      likeCount: s.likeCount,
      dislikeCount: s.dislikeCount,
      myReaction: s.myReaction,
      children: [],
    });
  }
  const roots: CommentNode[] = [];
  for (const r of rows) {
    const node = nodes.get(r.id)!;
    if (r.parent_id && nodes.has(r.parent_id)) {
      nodes.get(r.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="mb-4 font-display text-xl tracking-wide">
        댓글 <span className="text-thunder">{rows.length}</span>
      </h2>

      {user ? (
        <div className="card-mecha rounded-xl p-4">
          <CommentForm productId={productId} />
        </div>
      ) : (
        <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted">
          댓글을 쓰려면{" "}
          <a
            href={`/login?next=/products/${productId}`}
            className="font-medium text-thunder hover:underline"
          >
            로그인
          </a>
          이 필요해.
        </p>
      )}

      <div className="mt-4 divide-y divide-border">
        {roots.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            아직 댓글이 없어. 첫 댓글의 주인공이 되어보자!
          </p>
        ) : (
          roots.map((node) => (
            <CommentItem
              key={node.id}
              comment={node}
              productId={productId}
              currentUserId={user?.id ?? null}
            />
          ))
        )}
      </div>
    </section>
  );
}
