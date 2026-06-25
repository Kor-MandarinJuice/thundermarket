"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

// 목록을 최신 데이터로 다시 불러오는 버튼
export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className="rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-muted transition-colors hover:border-thunder hover:text-foreground disabled:opacity-60"
    >
      <span className={isPending ? "inline-block animate-spin" : ""}>↻</span>{" "}
      {isPending ? "새로고침 중..." : "새로고침"}
    </button>
  );
}
