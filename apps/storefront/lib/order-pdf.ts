import { jsPDF } from "jspdf";
import type { OrderSnapshot } from "./guest-checkout";

const currency = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value).replace(/\u00a0/g, " ");
export async function buildOrderPdf(order: OrderSnapshot) {
  const response = await fetch("/ferready/fonts/manrope.ttf");
  if (!response.ok) throw new Error("Font unavailable");
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  const pdf = new jsPDF({ compress: true });
  pdf.addFileToVFS("manrope.ttf", btoa(binary));
  pdf.addFont("manrope.ttf", "Manrope", "normal");
  pdf.setFont("Manrope");
  pdf.setProperties({ title: "Comprobante de pedido no fiscal — Ferready demo", subject: "Pendiente de pago. No es una factura fiscal." });
  let y = 20;
  const page = () => { pdf.addPage(); y = 20; };
  const text = (value: string, size = 10, width = 174) => {
    pdf.setFontSize(size);
    const lines: string[] = pdf.splitTextToSize(value, width);
    for (const line of lines) { if (y > 270) page(); pdf.text(line, 18, y); y += size * 0.48; }
    y += 3;
  };
  pdf.setTextColor(29, 54, 89);
  text("Ferready · demostración", 19);
  text("COMPROBANTE DE PEDIDO NO FISCAL", 13);
  text("PENDIENTE DE PAGO", 13);
  text(`Referencia de demo: ${order.reference}`, 9);
  text(`Fecha: ${new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(order.createdAt))} (America/Bogota)`);
  text("No es factura electrónica ni documento fiscal DIAN. No acredita un pago ni un pedido real. Precios y entrega de demostración.");
  y += 3; text("Datos de entrega", 13);
  const d = order.delivery;
  for (const value of [d.fullName, `${d.email} · ${d.phone}`, d.address, d.complement, d.neighborhood, d.city === "Otro municipio" ? d.municipality : d.city]) if (value) text(value);
  y += 4;
  const tableHeader = () => {
    if (y > 245) page();
    pdf.setFontSize(9); pdf.setFillColor(241, 243, 245); pdf.rect(18, y - 5, 174, 10, "F");
    pdf.text("Producto", 20, y); pdf.text("Cant.", 115, y); pdf.text("Unitario", 147, y, { align: "right" }); pdf.text("Subtotal", 190, y, { align: "right" }); y += 12;
  };
  tableHeader();
  for (const item of order.items) {
    pdf.setFontSize(9);
    const lines: string[] = pdf.splitTextToSize(item.name, 87);
    const height = Math.max(12, lines.length * 5 + 5);
    if (y + height > 268) { page(); tableHeader(); }
    pdf.text(lines, 20, y, { lineHeightFactor: 1.5 });
    pdf.text(String(item.quantity), 119, y, { align: "right" }); pdf.text(currency(item.unitPrice), 147, y, { align: "right" }); pdf.text(currency(item.subtotal), 190, y, { align: "right" }); y += height;
  }
  if (y > 215) page();
  y += 6; text(`Subtotal de productos: ${currency(order.subtotal)}`);
  text(`Envío estimado: ${order.shipping === null ? "Por confirmar (no incluido)" : currency(order.shipping)}`);
  text(`${order.shipping === null ? "Total parcial, sin envío" : "Total estimado"}: ${currency(order.total)} COP`, 13);
  text(`Entrega: ${order.timing}. Cobertura, tarifas y fechas reales no definidas.`);
  text("Pago no disponible. No se realizó ningún cobro. No se creó ni envió un pedido a la tienda. El carrito se conserva.");
  text("Este PDF contiene los datos que escribiste. Compártelo solo si deseas revelar esa información. Los datos del formulario no se guardan al recargar.", 9);
  const count = pdf.getNumberOfPages();
  for (let i = 1; i <= count; i++) { pdf.setPage(i); pdf.setFontSize(8); pdf.text(`DEMO · NO FISCAL · PENDIENTE DE PAGO | Página ${i} de ${count}`, 18, 286); }
  return pdf.output("blob");
}
export async function downloadOrderPdf(order: OrderSnapshot) {
  const blob = await buildOrderPdf(order);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = `${order.reference}.pdf`;
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
