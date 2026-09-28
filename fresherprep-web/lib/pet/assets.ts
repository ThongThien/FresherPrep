const SAFE_ASSET = /^[a-zA-Z0-9/_-]+\.(webp|png|jpg|jpeg)$/;

export function petAsset(reference: string) {
  const normalized = reference.replace(/^\/+/, "").replace(/^static\//, "");
  return SAFE_ASSET.test(normalized) ? "/static/" + normalized : "/static/pets/placeholder.webp";
}
