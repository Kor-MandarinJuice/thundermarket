// 판매글(상품) 공용 타입 / 상수 / 표시 도구

export type ProductStatus = "on_sale" | "reserved" | "sold";

export type Product = {
  id: string;
  seller_id: string;
  seller_nickname: string;
  title: string;
  description: string;
  price: number;
  status: ProductStatus;
  image_urls: string[];
  created_at: string;
  updated_at: string;
};

// 목록용: 좋아요/댓글 수가 포함된 형태
export type ProductWithCounts = Product & {
  like_count: number;
  comment_count: number;
};

// 사진 업로드 제한
export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

// 판매 상태 선택지 (화면 표시용 라벨 포함)
export const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "on_sale", label: "판매중" },
  { value: "reserved", label: "예약중" },
  { value: "sold", label: "판매완료" },
];

export function statusLabel(status: string): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

// 12000 -> "12,000원", 0 -> "나눔"
export function formatPrice(price: number): string {
  if (price <= 0) return "나눔";
  return price.toLocaleString("ko-KR") + "원";
}

// 작성 시각을 "방금 전 / N분 전 / N시간 전 / N일 전 / 날짜"로
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}
