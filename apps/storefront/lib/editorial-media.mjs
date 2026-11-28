import contentsSelection from "../../../data/approved/truper-contents-selection.json" with { type: "json" };
import first15Scenes from "../../../data/project/first15-truper-scenes.json" with { type: "json" };

function first15Scene(product) {
  if (!product.gallery?.some(view => view.src.includes("/first15-truper/"))) return null;
  const scene = first15Scenes[product.reference];
  return scene?.model === product.model ? scene : null;
}

/** User confirmation is scoped to an exact reference and model, never a category. */
export function confirmedContents(product) {
  const scene = first15Scene(product);
  if (scene) return {
    reference: product.reference, model: product.model,
    confirmation: { source: "owner-supplied-json", confirmed_at: "2026-11-27", manufacturer_verified: false },
    components: scene.components.map(component => ({ ...component, kind: "illustration" })),
  };
  const entry = contentsSelection[product.reference];
  return entry && entry.model === product.model && entry.confirmation.source === "user-confirmed" ? entry : null;
}

/**
 * Reviewed supplied illustrations, selected by identity rather than gallery order.
 * These are alternate/detail views, never evidence of package contents.
 */
export const editorialRoles = {
  "101895": { project: "e5c8950599f9", detail: "243d3540959e" },
  "103068": { project: "2b9a7918cf3a", detail: "35b3505f6187" },
  "104275": { project: "df997fdf415a", detail: "60aa5815dde8" },
  "104412": { project: "90e798d4500c", detail: "2877ffd182a7" },
  "13448": { detail: "6a7326bdae79" },
  "14012": { project: "0cf960a1fa88", detail: "309dadc0927f" },
  "16182": { project: "9482d60c3265", detail: "ab24b84895f1" },
  "103030": { project: "d00412d8eeba", detail: "bc5a1e0f723d" },
  "103660": { project: "441cda28e751", detail: "eb0821caa7d5" },
};

export function editorialMedia(product) {
  const scene = first15Scene(product);
  if (scene) return [scene.main, scene.project, scene.main, scene.main].map((src, chapter) => ({
    src, alt: product.name, presentation: "object",
    role: ["product", "project", "contents", "packing"][chapter],
    note: chapter === 2 ? `Contenido según ficha aportada: ${scene.includes}`
      : chapter === 3 ? "Presentación ilustrativa; no es una fotografía del empaque."
      : product.gallery.find(view => view.src === src)?.caption ?? product.name,
  }));
  const gallery = product.gallery ?? [];
  const main = gallery.find(view => view.kind === "photo");
  if (!main) return null;
  const roles = editorialRoles[product.reference];
  const resolve = role => roles?.[role] ? gallery.find(view => view.src.includes(roles[role])) : undefined;
  return [main, resolve("project") ?? gallery.find(view => view.role === "angle") ?? main, main, main].map((view, chapter) => ({
    src: view.src,
    alt: product.name,
    presentation: view.kind === "illustration" ? "plate" : "object",
    role: ["product", "project", "contents", "packing"][chapter],
    note: chapter === 2 && confirmedContents(product)
      ? "Taladro: fotografía del fabricante. Mango y llave: ilustraciones suministradas. Inclusión confirmada por el usuario el 23/11/2026; no verificada por el fabricante."
      : `${view.caption}${chapter === 2 ? " · Solo se muestra el producto; contenido del empaque por confirmar" : chapter === 3 ? " · Empaque ilustrativo" : ""}`,
  }));
}

/**
 * A product photograph proves appearance, not an accessory inventory.
 * Confirmed contents stay exact-reference scoped; other accessories are explicitly
 * illustrative, never presented as an inventory shipped with the product.
 */
export function productTablePieces(product) {
  const scene = first15Scene(product);
  if (scene) return [{
    id: "product", label: "Producto", detail: product.name, src: scene.main,
    width: 1000, height: 1000,
    views: product.gallery.filter(view => view.kind === "photo").map(view => ({ src: view.src, detail: view.caption })),
  }, ...scene.components.map(component => ({ ...component, width: 1000, height: 1000 }))];
  const photo = product.gallery?.find(view => view.kind === "photo");
  if (!photo) return [];
  const confirmed = confirmedContents(product);
  const views = (product.gallery ?? []).filter(view => view.kind === "photo" || view.role === "angle" || view.role === "detail");
  const accessories = confirmed ? [] : (product.gallery ?? []).filter(view => view.role === "accessory").map((view, index) => {
    const label = accessoryLabel(view.observation);
    return {
      id: `accessory-${index}`,
      label,
      detail: `${label}${label === "Accesorio ilustrado" ? "" : " · ilustrado"}; inclusión por confirmar.`,
      src: view.src,
      width: 1000,
      height: 1000,
    };
  });
  return [{
    id: confirmed ? "drill" : "product",
    label: confirmed ? "Taladro" : "Producto",
    detail: confirmed ? "Taladro TAL-1/2N2 · fotografía del fabricante." : "Producto fotografiado. Contenido del empaque por confirmar con el fabricante.",
    src: photo.src,
    width: 1000,
    height: 1000,
    views: views.map(view => ({ src: view.src, detail: view.caption })),
  }, ...(confirmed?.components ?? []).map(component => ({
    id: component.id,
    label: component.label,
    detail: `${component.label} · ilustración suministrada, no fotografía.`,
    src: component.src,
    width: 1000,
    height: 1000,
  })), ...accessories];
}

function accessoryLabel(observation = "") {
  const labels = [
    [/puntas de prueba/i, "Puntas de prueba"], [/sonda/i, "Sonda térmica"],
    [/boquillas|agujas/i, "Boquillas y agujas"], [/cubierta/i, "Cubierta"],
    [/^(?:broquero|mandril)/i, "Broquero"], [/pila/i, "Pila"], [/tapón/i, "Tapón"],
    [/cargador/i, "Cargador"], [/batería/i, "Batería"], [/mango|empuñadura/i, "Mango auxiliar"],
    [/llave.*broquero/i, "Llave de broquero"], [/llave.*hexagonal|llave.*allen/i, "Llave hexagonal"],
    [/disco/i, "Disco"], [/bolsa|maletín|estuche/i, "Estuche"], [/clip/i, "Clip"],
    [/adaptador/i, "Adaptador"], [/broca/i, "Broca"], [/cincel/i, "Cincel"],
    [/punta|puntas/i, "Puntas"], [/carbones/i, "Carbones"], [/aceite/i, "Aceite"],
    [/grasa/i, "Grasa"], [/filtro/i, "Filtro"], [/manguera/i, "Manguera"],
    [/cable/i, "Cable"], [/pinzas/i, "Pinzas"], [/soporte/i, "Soporte"],
    [/tornillo/i, "Tornillos"], [/banda/i, "Banda"], [/plato/i, "Plato"],
    [/llave/i, "Llave"], [/conector|conexión/i, "Conector"],
  ];
  return labels.find(([pattern]) => pattern.test(observation))?.[1] ?? "Accesorio ilustrado";
}
