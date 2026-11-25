"use client";

import Link from "next/link";
import { Icon, useCart } from "./shell";
import { CartView } from "./purchase";
import { useState } from "react";

export function PendingPriceAdd({ slug }: { slug: string }) {
  const { cart, ready, busy, saveSelection } = useCart();
  const [quantity, setQuantity] = useState(1);
  const current = cart.find((item) => item.slug === slug)?.quantity ?? 0;
  return <>
    <div className="buy-controls">
      <div className="quantity-control">
        <button aria-label="Disminuir cantidad" disabled={quantity <= 1 || busy} onClick={() => setQuantity(quantity - 1)}><Icon name="minus" size={16} /></button>
        <output aria-label="Cantidad">{quantity}</output>
        <button aria-label="Aumentar cantidad" disabled={quantity + current >= 20 || busy} onClick={() => setQuantity(quantity + 1)}><Icon name="plus" size={16} /></button>
      </div>
      <button className="button button-red" disabled={!ready || busy || current + quantity > 20}
        onClick={() => { void saveSelection(slug, current + quantity); }}>
        {busy ? "Guardando…" : "Añadir al carrito"}
      </button>
    </div>
    <p>Guardamos tu selección, no un pedido. No reserva existencias ni permite pagos.</p>
    {current > 0 && <Link href="/carrito" className="text-link">Ver carrito ({current}) <Icon name="arrow" /></Link>}
  </>;
}

export function SelectionCartView() {
  return <CartView selection />;
}
