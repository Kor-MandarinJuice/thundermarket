"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STATUS_OPTIONS } from "@/lib/products";

export type ProductFormState = { error: string } | null;

const VALID_STATUS = STATUS_OPTIONS.map((s) => s.value) as string[];

// 폼에서 공통으로 값을 꺼내고 검증
function parseProductForm(formData: FormData):
  | { ok: true; values: { title: string; description: string; price: number; status: string } }
  | { ok: false; error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const status = String(formData.get("status") ?? "on_sale");

  if (!title) {
    return { ok: false, error: "제목을 입력해줘!" };
  }
  if (title.length > 100) {
    return { ok: false, error: "제목은 100자 이내로 적어줘." };
  }

  // 가격: 숫자만 허용, 빈 값은 0(나눔/무료)으로 처리
  const price = priceRaw === "" ? 0 : Number(priceRaw.replace(/,/g, ""));
  if (!Number.isInteger(price) || price < 0) {
    return { ok: false, error: "가격은 0 이상의 숫자로 입력해줘." };
  }
  if (price > 1_000_000_000) {
    return { ok: false, error: "가격이 너무 커! 10억 원 이하로 적어줘." };
  }

  if (!VALID_STATUS.includes(status)) {
    return { ok: false, error: "판매 상태가 올바르지 않아." };
  }

  return { ok: true, values: { title, description, price, status } };
}

// 판매글 작성 (Create)
export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요해. 먼저 로그인해줘!" };
  }

  const parsed = parseProductForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const nickname =
    (user.user_metadata?.nickname as string | undefined) ??
    user.email?.split("@")[0] ??
    "익명 용사";

  const { data, error } = await supabase
    .from("products")
    .insert({
      seller_id: user.id,
      seller_nickname: nickname,
      title: parsed.values.title,
      description: parsed.values.description,
      price: parsed.values.price,
      status: parsed.values.status,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "등록에 실패했어: " + error.message };
  }

  revalidatePath("/products");
  redirect(`/products/${data.id}`);
}

// 판매글 수정 (Update)
export async function updateProduct(
  id: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요해. 먼저 로그인해줘!" };
  }

  const parsed = parseProductForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  // 본인 글만 수정 (RLS로도 막히지만, 여기서도 한 번 더 확인)
  const { error } = await supabase
    .from("products")
    .update({
      title: parsed.values.title,
      description: parsed.values.description,
      price: parsed.values.price,
      status: parsed.values.status,
    })
    .eq("id", id)
    .eq("seller_id", user.id);

  if (error) {
    return { error: "수정에 실패했어: " + error.message };
  }

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

// 판매글 삭제 (Delete)
export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("seller_id", user.id);

  revalidatePath("/products");
  redirect("/products");
}
