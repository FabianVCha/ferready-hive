import { createHash } from "node:crypto";
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import SelectionCartService from "../../modules/selection-cart/service";
import { SELECTION_CART_MODULE } from "../../modules/selection-cart";

function session(req: MedusaRequest): string | null {
  const token = req.headers["x-selection-token"];
  return typeof token === "string" && /^[a-f0-9]{64}$/.test(token)
    ? createHash("sha256").update(token).digest("hex") : null;
}

async function respond(req: MedusaRequest, res: MedusaResponse, hash: string) {
  const service: SelectionCartService = req.scope.resolve(SELECTION_CART_MODULE);
  const lines = await service.listSelectionLines({ session_hash: hash }, { take: 100 });
  res.setHeader("Cache-Control", "no-store");
  res.json({
    pricing_status: "pending",
    checkout_allowed: false,
    items: lines.filter((line) => line.quantity > 0).map(({ slug, quantity }) => ({ slug, quantity })),
  });
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const hash = session(req);
  if (!hash) { res.status(401).json({ message: "Session required" }); return; }
  await respond(req, res, hash);
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const hash = session(req);
  if (!hash) { res.status(401).json({ message: "Session required" }); return; }
  const body = req.body as Record<string, unknown> | null;
  if (!body || Object.keys(body).some((key) => !["slug", "quantity"].includes(key)) ||
      typeof body.slug !== "string" || body.slug.length > 150 ||
      !Number.isInteger(body.quantity) || (body.quantity as number) < 0 || (body.quantity as number) > 20) {
    res.status(400).json({ message: "Expected product slug and quantity from 0 to 20" }); return;
  }
  const products = req.scope.resolve(Modules.PRODUCT);
  const [product] = await products.listProducts({ handle: body.slug }, { select: ["id", "handle", "metadata"] });
  if (!product || !product.metadata?.approved_by || !product.metadata?.reference ||
      product.metadata?.pricing_status !== "quote_required") {
    res.status(404).json({ message: "Approved pending-price product not found" }); return;
  }
  const service: SelectionCartService = req.scope.resolve(SELECTION_CART_MODULE);
  // Stable primary key prevents duplicate product lines, even on request retries.
  const id = `sel_${createHash("sha256").update(`${hash}:${product.id}`).digest("hex")}`;
  const [existing] = await service.listSelectionLines({ id });
  const data = { id, session_hash: hash, product_id: product.id, slug: body.slug, quantity: body.quantity as number };
  if (existing) await service.updateSelectionLines(data);
  else {
    try { await service.createSelectionLines(data); }
    catch (error) {
      // A competing first write can only collide on this session/product key.
      const [created] = await service.listSelectionLines({ id });
      if (!created) throw error;
      await service.updateSelectionLines(data);
    }
  }
  await respond(req, res, hash);
}
