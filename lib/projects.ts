export interface Project {
  id: string;
  name: string;
  isOwner: boolean;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateSuffix(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 6);
}

// Project ID doubles as the Liveblocks room ID.
export function buildRoomId(name: string, suffix: string): string {
  const slug = slugify(name) || "project";
  const safeSlug = slug.length > 93 ? slug.slice(0, 93).replace(/-+$/g, "") : slug;
  return `${safeSlug}-${suffix}`;
}
