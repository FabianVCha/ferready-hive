import type { Objective } from "@/lib/objectives.mjs";

export const objectives: Objective[] = [
  { id: "instalar", title: "Instalar una repisa", description: "Un punto de partida para perforar y fijar. Revisa el material y la compatibilidad antes de comprar.", image: "/ferready/products/484299.webp", items: [{ slug: "taladro-bauker-12v", quantity: 1 }, { slug: "brocas-bauker-13", quantity: 1 }, { slug: "chazos-tornillo-20", quantity: 1 }] },
  { id: "organizar", title: "Armar mi equipo", description: "Herramientas y organización para los pendientes de casa. Conserva solo lo que necesitas.", image: "/ferready/products/279788.webp", items: [{ slug: "caja-herramientas-bauker", quantity: 1 }, { slug: "herramientas-44-piezas", quantity: 1 }, { slug: "guantes-propack", quantity: 1 }] },
  { id: "cuidar", title: "Cuidar mi jardín", description: "Una selección sencilla para empezar a cuidar tus plantas y mantener tu espacio.", image: "/ferready/products/137879.webp", items: [{ slug: "tijera-podar-8", quantity: 1 }, { slug: "guantes-propack", quantity: 1 }] },
];
