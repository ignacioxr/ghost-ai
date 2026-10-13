export interface Project {
  id: string;
  name: string;
  isOwner: boolean;
}

export const MOCK_PROJECTS: Project[] = [
  { id: "p1", name: "Payments Platform", isOwner: true },
  { id: "p2", name: "Realtime Chat Backend", isOwner: true },
  { id: "p3", name: "Analytics Pipeline", isOwner: false },
];

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
