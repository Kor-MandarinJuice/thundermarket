"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STATUS_OPTIONS, MAX_IMAGES, MAX_IMAGE_BYTES } from "@/lib/products";

export type ProductFormState = { error: string } | null;

const VALID_STATUS = STATUS_OPTIONS.map((s) => s.value) as string[];

const BUCKET = "product-images";
// 공개 URL에서 저장소 내부 경로를 찾기 위한 표식
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;

// 허용 이미지 형식 → 파일 확장자
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

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
  if (price > 10_000_000_000_000) {
    return { ok: false, error: "가격이 너무 커! 10조 원 이하로 적어줘." };
  }

  if (!VALID_STATUS.includes(status)) {
    return { ok: false, error: "판매 상태가 올바르지 않아." };
  }

  return { ok: true, values: { title, description, price, status } };
}

// 폼에서 실제로 올라온 사진 파일만 추려냄
function pickImageFiles(formData: FormData): File[] {
  return formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);
}

// 사진들을 저장소에 올리고 공개 URL 목록을 돌려줌
async function uploadImages(
  supabase: SupabaseClient,
  userId: string,
  files: File[],
): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  const urls: string[] = [];
  for (const file of files) {
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return { ok: false, error: "이미지 파일(jpg/png/webp/gif)만 올릴 수 있어." };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: `사진 한 장은 5MB 이하여야 해. (${file.name})` };
    }

    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      // 일부만 올라간 경우 되돌리기
      await removeImagesByPath(supabase, urls.map(urlToPath).filter(isString));
      return { ok: false, error: "사진 업로드에 실패했어: " + error.message };
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return { ok: true, urls };
}

function isString(v: string | null): v is string {
  return v !== null;
}

// 공개 URL → 저장소 내부 경로 (삭제용)
function urlToPath(url: string): string | null {
  const i = url.indexOf(PUBLIC_MARKER);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + PUBLIC_MARKER.length));
}

async function removeImagesByPath(supabase: SupabaseClient, paths: string[]) {
  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }
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

  const files = pickImageFiles(formData);
  if (files.length < 1) {
    return { error: "사진을 최소 1장 올려줘!" };
  }
  if (files.length > MAX_IMAGES) {
    return { error: `사진은 최대 ${MAX_IMAGES}장까지 올릴 수 있어.` };
  }

  const uploaded = await uploadImages(supabase, user.id, files);
  if (!uploaded.ok) {
    return { error: uploaded.error };
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
      image_urls: uploaded.urls,
    })
    .select("id")
    .single();

  if (error) {
    // 글 저장이 실패하면 방금 올린 사진도 정리
    await removeImagesByPath(supabase, uploaded.urls.map(urlToPath).filter(isString));
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

  // 현재 글의 사진 목록을 가져와 본인 글인지 확인
  const { data: current } = await supabase
    .from("products")
    .select("image_urls, seller_id")
    .eq("id", id)
    .single();

  if (!current || current.seller_id !== user.id) {
    return { error: "이 글을 수정할 권한이 없어." };
  }

  const currentUrls: string[] = current.image_urls ?? [];
  // 화면에서 "유지"로 표시된 기존 사진들 (실제 보유 사진만 인정)
  const keepUrls = formData
    .getAll("keepImages")
    .map(String)
    .filter((u) => currentUrls.includes(u));

  const files = pickImageFiles(formData);

  if (keepUrls.length + files.length < 1) {
    return { error: "사진을 최소 1장 남겨줘!" };
  }
  if (keepUrls.length + files.length > MAX_IMAGES) {
    return { error: `사진은 최대 ${MAX_IMAGES}장까지야.` };
  }

  // 새로 추가된 사진 업로드
  let newUrls: string[] = [];
  if (files.length > 0) {
    const uploaded = await uploadImages(supabase, user.id, files);
    if (!uploaded.ok) {
      return { error: uploaded.error };
    }
    newUrls = uploaded.urls;
  }

  const finalUrls = [...keepUrls, ...newUrls];

  const { error } = await supabase
    .from("products")
    .update({
      title: parsed.values.title,
      description: parsed.values.description,
      price: parsed.values.price,
      status: parsed.values.status,
      image_urls: finalUrls,
    })
    .eq("id", id)
    .eq("seller_id", user.id);

  if (error) {
    // 수정 실패 시 새로 올린 사진 정리
    await removeImagesByPath(supabase, newUrls.map(urlToPath).filter(isString));
    return { error: "수정에 실패했어: " + error.message };
  }

  // 빠진 기존 사진은 저장소에서도 삭제 (best-effort)
  const removed = currentUrls.filter((u) => !keepUrls.includes(u));
  await removeImagesByPath(supabase, removed.map(urlToPath).filter(isString));

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

  // 사진 정리를 위해 먼저 주소 목록을 가져옴
  const { data: current } = await supabase
    .from("products")
    .select("image_urls")
    .eq("id", id)
    .eq("seller_id", user.id)
    .single();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("seller_id", user.id);

  // 글이 지워졌으면 사진도 저장소에서 삭제
  if (!error && current?.image_urls?.length) {
    await removeImagesByPath(
      supabase,
      (current.image_urls as string[]).map(urlToPath).filter(isString),
    );
  }

  revalidatePath("/products");
  redirect("/products");
}
