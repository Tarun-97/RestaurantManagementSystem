import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CartContext } from "../contexts/CartContext";

const API_BASE = "http://localhost:5000";

export default function OrderCart() {
  const { cart, removeFromCart, updateQty, clearCart } = useContext(CartContext);

  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [topCombos, setTopCombos] = useState([]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty * (item.price || 0), 0),
    [cart]
  );

  const orderItems = useMemo(
    () =>
      cart.map((item) => ({
        menuId: String(item.id),
        name: item.title,
        qty: item.qty,
        price: item.price || 0,
        comboId: item.comboId || null,
        comboName: item.comboName || null,
      })),
    [cart]
  );

  const focusedDishId = cart.length ? String(cart[0].id) : null;

  useEffect(() => {
    const fetchTop = async () => {
      if (!focusedDishId) {
        setTopCombos([]);
        return;
      }
      try {
        const { data } = await axios.get(`${API_BASE}/api/orders/recommendTop3`, {
          params: { dishId: focusedDishId },
          withCredentials: true,
        });
        setTopCombos(data.suggestions || []);
      } catch {
        setTopCombos([]);
      }
    };
    fetchTop();
  }, [focusedDishId, cart.length]);

  const placeOrder = async () => {
    if (!firstName.trim()) {
      setError("Name is required.");
      return;
    }
    if (!phone.trim()) {
      setError("Phone is required.");
      return;
    }
    if (cart.length === 0) {
      setError("Cart is empty. Please add items.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE}/api/orders`,
        {
          firstName,
          phone,
          email,
          items: orderItems,
          total,
          notes: "",
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        const serverOrder = response.data.order;
        alert(
          `Order placed! ID: ${serverOrder._id}\nTime: ${new Date(
            serverOrder.createdAt
          ).toLocaleString()}`
        );
        clearCart();
        setFirstName("");
        setPhone("");
        setEmail("");
      } else {
        setError("Failed to place order. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error placing order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-cart">
      <h2>Your Cart</h2>

      {topCombos.length > 0 && (
        <div style={{ marginTop: 8, marginBottom: 8, border: "1px solid #ddd", padding: 10 }}>
          <strong>Frequently chosen combos for this dish</strong>
          <ul>
            {topCombos.map((c) => (
              <li key={c.comboId}>
                {c.comboName} (chosen {c.count} times)
              </li>
            ))}
          </ul>
        </div>
      )}

      {cart.length === 0 ? (
        <p>No items in cart</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Details</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.lineKey}>
                <td>{item.title}</td>
                <td>{item.comboName || "No combo"}</td>
                <td>
                  <div className="qty-controls">
                    <button className="btn btn-ghost" onClick={() => updateQty(item.lineKey, item.qty - 1)}>-</button>
                    <input
                      type="number"
                      value={item.qty}
                      min="1"
                      onChange={(e) => updateQty(item.lineKey, Number(e.target.value))}
                    />
                    <button className="btn btn-ghost" onClick={() => updateQty(item.lineKey, item.qty + 1)}>+</button>
                  </div>
                </td>
                <td>${(item.price || 0).toFixed(2)}</td>
                <td>${(item.qty * (item.price || 0)).toFixed(2)}</td>
                <td>
                  <button className="btn btn-danger" onClick={() => removeFromCart(item.lineKey)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 16 }}>
        <div>
          <label htmlFor="firstName">Name:</label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="phone">Phone:</label>
          <input
            id="phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="email">Email (optional):</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div style={{ marginTop: 12, fontWeight: 600 }}>Cart Total: ${total.toFixed(2)}</div>

      <button className="btn btn-primary" onClick={placeOrder} disabled={loading || cart.length === 0}>
        {loading ? "Placing..." : "Place Order"}
      </button>
    </div>
  );
}
