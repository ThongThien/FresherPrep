export const PET_ASSET_BY_LEVEL: Readonly<Record<number, string>> = {
  1: "/static/pet/lv1.webp",
  2: "/static/pet/lv2.webp",
  3: "/static/pet/lv3.webp",
};

export function petAsset(level: number) {
  return PET_ASSET_BY_LEVEL[level] ?? PET_ASSET_BY_LEVEL[1];
}
