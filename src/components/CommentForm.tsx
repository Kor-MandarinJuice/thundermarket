"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { addComment } from "@/app/products/interactions";

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-thunder shrink-0 self-end rounded-md px-4 py-2 text-sm disabled:opacity-60"
    >
      {pending ? "..." : label}
    </button>
  );
}

export function CommentForm({
  productId,
  parentId,
  placeholder = "댓글을 남겨보세요",
  submitLabel = "등록",
  onDone,
  autoFocus,
}: {
  productId: string;
  parentId?: string;
  placeholder?: string;
  submitLabel?: string;
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await addComment(fd);
        formRef.current?.reset();
        onDone?.();
      }}
      className="flex gap-2"
    >
      <input type="hidden" name="productId" value={productId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <textarea
        name="content"
        required
        rows={2}
        maxLength={1000}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="input-mecha w-full resize-y rounded-md px-3 py-2 text-sm"
      />
      <SubmitBtn label={submitLabel} />
    </form>
  );
}
