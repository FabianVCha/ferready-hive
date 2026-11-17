export type Delivery = { fullName: string; email: string; phone: string; address: string; city: string; municipality: string; neighborhood: string; complement: string };
export const emptyDelivery: Delivery = { fullName: "", email: "", phone: "", address: "", city: "Bogotá", municipality: "", neighborhood: "", complement: "" };
export type DeliveryErrors = Partial<Record<keyof Delivery, string>>;
export function validateDelivery(value: Delivery): DeliveryErrors {
  const errors: DeliveryErrors = {};
  for (const key of ["fullName", "email", "phone", "address", "city"] as const) if (!value[key].trim()) errors[key] = "Completa este campo.";
  for (const [key, text] of Object.entries(value)) {
    if (text.length > (key === "address" ? 180 : 120)) errors[key as keyof Delivery] = "El texto es demasiado largo.";
    if (/[\u0000-\u001f\u007f]/u.test(text)) errors[key as keyof Delivery] = "Usa texto sin saltos de línea ni caracteres de control.";
  }
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value.email.trim())) errors.email = "Escribe un correo válido, como nombre@example.com.";
  const digits = value.phone.replace(/\D/g, "");
  if (value.phone && (!/^[+\d\s().-]+$/.test(value.phone) || digits.length < 7 || digits.length > 15)) errors.phone = "Escribe un teléfono válido; puedes incluir +57.";
  if (!["Bogotá", "Chía", "Soacha", "Otro municipio"].includes(value.city)) errors.city = "Elige una ciudad o municipio.";
  if (value.city === "Otro municipio" && !value.municipality.trim()) errors.municipality = "Escribe el nombre del municipio.";
  return errors;
}
export function deliveryEstimate(city: string) {
  return city === "Bogotá" ? { amount: 12000, timing: "1–2 días hábiles de ejemplo" } : ["Chía", "Soacha"].includes(city) ? { amount: 18000, timing: "2–3 días hábiles de ejemplo" } : { amount: null, timing: "Cobertura, tarifa y plazo por confirmar" };
}
export type OrderSnapshot = { reference: string; createdAt: string; delivery: Delivery; items: { slug: string; name: string; quantity: number; unitPrice: number; subtotal: number }[]; subtotal: number; shipping: number | null; total: number; timing: string };
export function createSnapshot(cart: { slug: string; quantity: number }[], catalog: { slug: string; name: string; price: number }[], delivery: Delivery, reference: string, createdAt: string): OrderSnapshot {
  if (Object.keys(validateDelivery(delivery)).length) throw new Error("Invalid delivery");
  const items = cart.map(item => {
    const product = catalog.find(product => product.slug === item.slug);
    if (!product || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) throw new Error("Invalid cart");
    return { slug: product.slug, name: product.name, quantity: item.quantity, unitPrice: product.price, subtotal: product.price * item.quantity };
  });
  if (!items.length) throw new Error("Empty cart");
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const shipping = deliveryEstimate(delivery.city);
  return { reference, createdAt, delivery: Object.fromEntries(Object.entries(delivery).map(([key, text]) => [key, text.trim()])) as Delivery, items, subtotal, shipping: shipping.amount, total: subtotal + (shipping.amount ?? 0), timing: shipping.timing };
}
