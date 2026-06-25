"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { STATUS_OPTIONS, type Product } from "@/lib/products";
import type { ProductFormState } from "@/app/products/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-thunder w-full rounded-md py-3 text-base disabled:opacity-60"
    >
      {pending ? "저장 중..." : label}
    </button>
  );
}

export function ProductForm({
  action,
  product,
  submitLabel,
}: {
  // 글쓰기/수정 둘 다 (prevState, formData) => state 형태
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  product?: Product;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState<ProductFormState, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="card-mecha rounded-xl p-6">
      <label className="mb-4 block">
        <span className="mb-1.5 block text-sm font-medium text-muted">제목</span>
        <input
          name="title"
          type="text"
          required
          maxLength={100}
          defaultValue={product?.title ?? ""}
          placeholder="예) 다간 합체로봇 미개봉 팝니다"
          className="input-mecha w-full rounded-md px-4 py-3"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1.5 block text-sm font-medium text-muted">
          가격 (원) · 비우거나 0이면 나눔
        </span>
        <input
          name="price"
          type="number"
          min={0}
          step={100}
          defaultValue={product ? product.price : ""}
          placeholder="0"
          className="input-mecha w-full rounded-md px-4 py-3"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1.5 block text-sm font-medium text-muted">
          판매 상태
        </span>
        <select
          name="status"
          defaultValue={product?.status ?? "on_sale"}
          className="input-mecha w-full rounded-md px-4 py-3"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-muted">
          상품 설명
        </span>
        <textarea
          name="description"
          rows={7}
          defaultValue={product?.description ?? ""}
          placeholder="상품 상태, 거래 방법 등을 자세히 적어줘."
          className="input-mecha w-full resize-y rounded-md px-4 py-3"
        />
      </label>

      {state?.error && (
        <p className="mt-4 rounded-md border border-hero-red/40 bg-hero-red/10 px-3 py-2 text-sm text-hero-red">
          ⚠ {state.error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Link
          href={product ? `/products/${product.id}` : "/products"}
          className="flex-1 rounded-md border border-border bg-surface px-4 py-3 text-center text-sm transition-colors hover:border-thunder"
        >
          취소
        </Link>
        <div className="flex-1">
          <SubmitButton label={submitLabel} />
        </div>
      </div>
    </form>
  );
}
