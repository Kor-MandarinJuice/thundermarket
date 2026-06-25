import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  formatPrice,
  statusLabel,
  timeAgo,
  type Product,
} from "@/lib/products";
import { RefreshButton } from "@/components/RefreshButton";

export const metadata = {
  title: "상품 둘러보기 · 천둥마켓",
};

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "sold"
      ? "border-border bg-surface-2 text-muted"
      : status === "reserved"
        ? "border-electric/40 bg-electric/10 text-electric"
        : "border-thunder/40 bg-thunder/10 text-thunder";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${style}`}>
      {statusLabel(status)}
    </span>
  );
}

export default async function ProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (products ?? []) as Product[];

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide">
            <span className="text-thunder-grad">번개 장터</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            우리 동네 용사들의 거래 목록
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
          <Link href="/products/new" className="btn-thunder rounded-md px-5 py-2.5 text-sm">
            ⚡ 판매하기
          </Link>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card-mecha rounded-xl px-6 py-20 text-center">
          <div className="mb-3 text-4xl">📦</div>
          <p className="text-muted">아직 등록된 상품이 없어.</p>
          <p className="mt-1 text-sm text-muted">
            첫 거래의 주인공이 되어보자!
          </p>
          {user && (
            <Link
              href="/products/new"
              className="btn-thunder mt-6 inline-block rounded-md px-6 py-2.5 text-sm"
            >
              첫 상품 등록하기
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <li key={p.id}>
              <Link
                href={`/products/${p.id}`}
                className="card-mecha block h-full overflow-hidden rounded-xl transition-colors hover:border-thunder"
              >
                <div className="relative aspect-[4/3] bg-surface-2">
                  {p.image_urls?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_urls[0]}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl text-muted">
                      📦
                    </div>
                  )}
                  {p.image_urls?.length > 1 && (
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/65 px-2 py-0.5 text-xs text-white">
                      📷 {p.image_urls.length}
                    </span>
                  )}
                </div>
                <div className="p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 font-display text-lg leading-snug tracking-wide">
                    {p.title}
                  </h2>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mb-4 line-clamp-2 text-sm text-muted">
                  {p.description || "설명이 없어요."}
                </p>
                <div className="flex items-end justify-between">
                  <span className="font-display text-xl text-thunder">
                    {formatPrice(p.price)}
                  </span>
                  <span className="text-xs text-muted">
                    {p.seller_nickname} · {timeAgo(p.created_at)}
                  </span>
                </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
