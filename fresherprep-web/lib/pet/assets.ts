const SAFE_ASSET = /^[a-zA-Z0-9/_-]+\.(webp|png|jpg|jpeg)$/;

export function petAsset(reference: string) {
  try {
    const url = new URL(reference);
    if (
      url.protocol === "https:" &&
      url.hostname.endsWith(".supabase.co") &&
      url.pathname.startsWith("/storage/v1/object/public/")
    ) {
      return url.toString();
    }
  } catch {
    // Legacy local asset references are handled below.
  }
  const normalized = reference.replace(/^\/+/, "").replace(/^static\//, "");
  return SAFE_ASSET.test(normalized) ? "/static/" + normalized : "/static/pets/placeholder.webp";
}
