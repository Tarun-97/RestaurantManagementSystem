import React, { createContext, useEffect, useMemo, useState } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("cart_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cart_v1", JSON.stringify(cart));
  }, [cart]);

  const makeLineKey = (item) => {
    const comboPart = item.comboId ? `|${item.comboId}` : "|_";
    return `${item.id}${comboPart}`;
  };

  const addToCart = (item) => {
    const lineKey = makeLineKey(item);
    const exists = cart.find((i) => i.lineKey === lineKey);
    if (exists) {
      setCart(cart.map((i) => (i.lineKey === lineKey ? { ...i, qty: i.qty + 1 } : i)));
    } else {
      setCart([...cart, { ...item, qty: 1, lineKey }]);
    }
  };

  const removeFromCart = (lineKey) => {
    setCart(cart.filter((i) => i.lineKey !== lineKey));
  };

  const updateQty = (lineKey, qty) => {
    if (qty <= 0) return setCart(cart.filter((i) => i.lineKey !== lineKey));
    setCart(cart.map((i) => (i.lineKey === lineKey ? { ...i, qty } : i)));
  };

  const clearCart = () => setCart([]);

  const value = useMemo(
    () => ({ cart, addToCart, removeFromCart, updateQty, clearCart }),
    [cart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
