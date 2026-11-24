import { model } from "@medusajs/framework/utils";

// This is a precommercial selection, never a priced Medusa cart or order.
export default model.define("selection_line", {
  id: model.id().primaryKey(),
  session_hash: model.text(),
  product_id: model.text(),
  slug: model.text(),
  quantity: model.number(),
});
