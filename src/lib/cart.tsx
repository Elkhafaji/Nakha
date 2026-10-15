import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Product } from "../data";

type CartLine = Product & { quantity: number };
type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  add: (product: Product) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "nakha_cart_v2";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(items)), [items]);
  const value = useMemo(() => ({
    items,
    count: items.reduce((n, x) => n + x.quantity, 0),
    subtotal: items.reduce((n, x) => n + x.price * x.quantity, 0),
    add: (p: Product) => setItems(xs => { const found = xs.find(x => x.id === p.id); return found ? xs.map(x => x.id === p.id ? { ...x, quantity: x.quantity + 1 } : x) : [...xs, { ...p, quantity: 1 }]; }),
    increment: (id: string) => setItems(xs => xs.map(x => x.id === id ? { ...x, quantity: x.quantity + 1 } : x)),
    decrement: (id: string) => setItems(xs => xs.flatMap(x => x.id !== id ? [x] : x.quantity > 1 ? [{ ...x, quantity: x.quantity - 1 }] : [])),
    remove: (id: string) => setItems(xs => xs.filter(x => x.id !== id)),
    clear: () => setItems([]),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { const value = useContext(CartContext); if (!value) throw new Error("useCart must be used inside CartProvider"); return value; }
