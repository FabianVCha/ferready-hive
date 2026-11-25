import { Module } from "@medusajs/framework/utils";
import SelectionCartService from "./service";

export const SELECTION_CART_MODULE = "selectionCart";
export default Module(SELECTION_CART_MODULE, { service: SelectionCartService });
