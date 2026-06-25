"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { STATUS_OPTIONS, MAX_IMAGES, type Product } from "@/lib/products";
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
  nickname,
}: {
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  product?: Product;
  submitLabel: string;
  nickname: string;
}) {
  const [state, formAction] = useActionState<ProductFormState, FormData>(
    action,
    null,
  );

  // 기존 사진(수정 시) 중 유지할 것 / 새로 추가할 파일
  const [keep, setKeep] = useState<string[]>(product?.image_urls ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [imgError, setImgError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // 붙여넣기 핸들러에서 최신 files를 참조하기 위한 보관용
  const filesRef = useRef<File[]>([]);

  const total = keep.length + files.length;

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // 새 파일 미리보기 URL 만들기/정리
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  // files 상태를 실제 <input>에 반영해서 폼 제출 시 함께 전송
  useEffect(() => {
    if (!inputRef.current) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    inputRef.current.files = dt.files;
  }, [files]);

  // 파일 선택/붙여넣기 공통: 이미지 파일들을 목록에 추가
  const addFiles = useCallback(
    (picked: File[]) => {
      const imgs = picked.filter((f) => f.type.startsWith("image/"));
      if (imgs.length === 0) return;

      const merged = [...filesRef.current];
      for (const f of imgs) {
        const dup = merged.some(
          (m) =>
            m.name === f.name &&
            m.size === f.size &&
            m.lastModified === f.lastModified,
        );
        if (!dup) merged.push(f);
      }

      const room = MAX_IMAGES - keep.length;
      if (merged.length > room) {
        setImgError(`사진은 최대 ${MAX_IMAGES}장까지야.`);
        setFiles(merged.slice(0, Math.max(room, 0)));
      } else {
        setImgError(null);
        setFiles(merged);
      }
    },
    [keep.length],
  );

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(e.target.files ?? []));
  }

  // 복사한 이미지를 Ctrl+V로 붙여넣기
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      const picked: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) picked.push(f);
        }
      }
      if (picked.length > 0) {
        e.preventDefault();
        addFiles(picked);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  function removeNew(idx: number) {
    setImgError(null);
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function removeExisting(url: string) {
    setImgError(null);
    setKeep((prev) => prev.filter((u) => u !== url));
  }

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

      {/* 사진 영역 */}
      <div className="mb-4">
        <span className="mb-1.5 block text-sm font-medium text-muted">
          사진 ({total}/{MAX_IMAGES}) · 최소 1장
        </span>

        {(keep.length > 0 || previews.length > 0) && (
          <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {/* 유지 중인 기존 사진 */}
            {keep.map((url) => (
              <div key={url} className="group relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="기존 사진"
                  className="h-full w-full rounded-md border border-border object-cover"
                />
                <input type="hidden" name="keepImages" value={url} />
                <button
                  type="button"
                  onClick={() => removeExisting(url)}
                  className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white hover:bg-hero-red"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* 새로 추가한 사진 미리보기 */}
            {previews.map((url, i) => (
              <div key={url} className="group relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="새 사진"
                  className="h-full w-full rounded-md border border-thunder/50 object-cover"
                />
                <span className="absolute left-1 top-1 rounded bg-thunder/90 px-1 text-[10px] font-bold text-black">
                  NEW
                </span>
                <button
                  type="button"
                  onClick={() => removeNew(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white hover:bg-hero-red"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          name="images"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          onChange={handlePick}
          disabled={total >= MAX_IMAGES}
          className="block w-full cursor-pointer text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-surface-2 file:px-4 file:py-2 file:text-sm file:text-foreground hover:file:bg-border disabled:opacity-50"
        />
        <p className="mt-1.5 text-xs text-muted">
          jpg · png · webp · gif / 한 장당 5MB 이하 · 복사한 이미지를{" "}
          <kbd className="rounded border border-border bg-surface-2 px-1">
            Ctrl
          </kbd>
          +
          <kbd className="rounded border border-border bg-surface-2 px-1">V</kbd>{" "}
          로 붙여넣기도 가능
        </p>
        {imgError && (
          <p className="mt-1.5 text-xs text-hero-red">⚠ {imgError}</p>
        )}
      </div>

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

      <div className="mb-4">
        <span className="mb-1.5 block text-sm font-medium text-muted">
          작성자 표시
        </span>
        <div className="flex gap-3">
          <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface-2 px-4 py-3 text-sm has-[:checked]:border-thunder has-[:checked]:bg-thunder/10">
            <input
              type="radio"
              name="is_anonymous"
              value="true"
              defaultChecked={product ? product.is_anonymous : true}
              className="accent-thunder"
            />
            <span>🕶 익명</span>
          </label>
          <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface-2 px-4 py-3 text-sm has-[:checked]:border-thunder has-[:checked]:bg-thunder/10">
            <input
              type="radio"
              name="is_anonymous"
              value="false"
              defaultChecked={product ? !product.is_anonymous : false}
              className="accent-thunder"
            />
            <span>🛡 닉네임 공개 ({nickname})</span>
          </label>
        </div>
      </div>

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
