export const first15Categories = [
  { handle: "herramientas-electricas", name: "Herramientas eléctricas" },
  { handle: "accesorios-y-consumibles", name: "Accesorios y consumibles" },
  { handle: "herramientas-manuales", name: "Herramientas manuales" },
  { handle: "fijacion-y-herrajes", name: "Fijación y herrajes" },
  { handle: "electricidad-y-medicion", name: "Electricidad y medición" },
  { handle: "proteccion", name: "Protección" },
];

// Keep storefront wording and regional search terms tied to the exact reference.
const discoveryByReference: Record<string, { category: string; cardTitle: string; searchAliases: string[] }> = {
  104412: { category: "herramientas-electricas", cardTitle: "Rotomartillo 12 V · 3/8″", searchAliases: ["taladro percutor inalámbrico"] },
  104271: { category: "herramientas-electricas", cardTitle: "Rotomartillo 20 V · 1/2″", searchAliases: ["taladro percutor inalámbrico"] },
  14659: { category: "herramientas-electricas", cardTitle: "Rotomartillo 850 W · 1/2″", searchAliases: ["taladro percutor con cable"] },
  11145: { category: "herramientas-manuales", cardTitle: "Caja de herramientas de 22″", searchAliases: ["organizador de herramientas"] },
  11899: { category: "accesorios-y-consumibles", cardTitle: "Disco de corte para metal · 4-1/2″", searchAliases: ["disco para pulidora"] },
  11335: { category: "accesorios-y-consumibles", cardTitle: "11 brocas para metal y concreto", searchAliases: ["brocas para cemento"] },
  12906: { category: "accesorios-y-consumibles", cardTitle: "Sellador de poliuretano blanco · 280 ml", searchAliases: [] },
  40159: { category: "fijacion-y-herrajes", cardTitle: "20 chazos de 1/4″ con tornillos y broca", searchAliases: ["chazo tarugo taco de expansión tornillo"] },
  102410: { category: "herramientas-manuales", cardTitle: "44 herramientas para mecánica · 3/8″", searchAliases: ["juego de copas dados"] },
  18025: { category: "proteccion", cardTitle: "Guantes con nitrilo · talla pequeña", searchAliases: ["guantes para trabajo"] },
  23566: { category: "fijacion-y-herrajes", cardTitle: "Cerradura de pomo para baño", searchAliases: ["chapa para baño perilla"] },
  23104: { category: "herramientas-manuales", cardTitle: "Tijera de poda de 8″", searchAliases: ["podadora manual tijeras de jardinería"] },
  46993: { category: "electricidad-y-medicion", cardTitle: "Bombillo LED 9 W con sensor", searchAliases: ["bombillo bombilla sensor de movimiento"] },
  100362: { category: "electricidad-y-medicion", cardTitle: "Multímetro automático · 750 V", searchAliases: ["tester polímetro"] },
};

export function first15Discovery(reference: string) {
  return Object.hasOwn(discoveryByReference, reference) ? discoveryByReference[reference] : undefined;
}
