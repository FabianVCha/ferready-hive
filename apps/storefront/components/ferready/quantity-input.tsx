"use client";

import { useState } from "react";
import { parseQuantity } from "@/lib/objectives.mjs";
import { Icon } from "./shell";

export function QuantityInput({ name, value, onChange, disabled = false, commitOnBlur = false }: { name: string; value: number; onChange: (value: number) => void; disabled?: boolean; commitOnBlur?: boolean }) {
  const [draft, setDraft] = useState<string | null>(null);
  return <div className="quantity-control">
    <button aria-label={`Disminuir cantidad de ${name}`} disabled={disabled || value <= 1} onClick={() => { setDraft(null); onChange(value - 1); }}><Icon name="minus" size={16} /></button>
    <input type="number" inputMode="numeric" min="1" max="20" step="1" readOnly={disabled} aria-label={`Cantidad de ${name}`} aria-invalid={draft !== null && parseQuantity(draft) === null} title="Cantidad entre 1 y 20; un valor inválido se restaura al salir." value={draft ?? value} onChange={(event) => { const text = event.target.value; setDraft(text); const next = parseQuantity(text); if (!commitOnBlur && next !== null) onChange(next); }} onBlur={() => { const next = draft === null ? null : parseQuantity(draft); if (commitOnBlur && !disabled && next !== null && next !== value) onChange(next); setDraft(null); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
    <button aria-label={`Aumentar cantidad de ${name}`} disabled={disabled || value >= 20} onClick={() => { setDraft(null); onChange(value + 1); }}><Icon name="plus" size={16} /></button>
  </div>;
}
