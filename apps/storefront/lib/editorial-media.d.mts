export type EditorialRole = "product" | "project" | "contents" | "packing";
export type EditorialView = {
  src: string;
  alt: string;
  presentation: "plate" | "object";
  role: EditorialRole;
  note: string;
};
export const editorialRoles: Record<string, { project?: string; detail?: string }>;
export type TablePiece = { id: string; label: string; detail: string; src: string; width: number; height: number; views?: { src: string; detail: string }[] };
export function confirmedContents(product: { reference?: string; model?: string }): {
  reference: string; model: string;
  confirmation: { source: string; confirmed_at: string; manufacturer_verified: boolean };
  components: { id: string; label: string; src: string; kind: string }[];
} | null;
export function productTablePieces(product: { reference?: string; model?: string; gallery?: { src: string; kind: "photo" | "illustration"; role?: string; caption?: string; observation?: string }[] }): TablePiece[];
export function editorialMedia(product: {
  reference?: string;
  model?: string;
  name: string;
  gallery?: { src: string; kind: "photo" | "illustration"; caption: string }[];
}): EditorialView[] | null;
