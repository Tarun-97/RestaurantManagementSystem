import React, { useContext, useMemo, useState } from "react";
import axios from "axios";
import { data } from "../restApi.json";
import { Link } from "react-router-dom";
import { CartContext } from "../contexts/CartContext";

const API_BASE = "http://localhost:5000";

const Menu = () => {
  const { cart, addToCart, removeFromCart } = useContext(CartContext);

  // Separate combos list that applies to any dish
  const combos = data[0].combos || [];

  // Selected combo per dish (not required to add)
  const [selectedComboByDish, setSelectedComboByDish] = useState({});

  // Recommended combos per dish (top-3 by usage)
  const [topCombosByDish, setTopCombosByDish] = useState({});

  const dishes = useMemo(() => data[0].dishes, []);

  const onTapImage = (dish) => {
    const sel = selectedComboByDish[dish.id] || null;
    const price = dish.price + (sel ? sel.extraPrice : 0);
    addToCart({
      ...dish,
      price,
      comboId: sel ? sel.comboId : null,
      comboName: sel ? sel.comboName : null,
      comboExtra: sel ? sel.extraPrice : 0,
    });
  };

  const handleSelectCombo = (dishId, combo) => {
    setSelectedComboByDish({
      ...selectedComboByDish,
      [dishId]: combo,
    });
  };

  const loadTopCombos = async (dishId) => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/orders/recommendTop3`, {
        params: { dishId: String(dishId) },
        withCredentials: true,
      });
      setTopCombosByDish((prev) => ({ ...prev, [dishId]: data.suggestions || [] }));
    } catch {
      setTopCombosByDish((prev) => ({ ...prev, [dishId]: [] }));
    }
  };

  return (
    <section className="menu" id="menu">
      <div className="container">
        <div className="heading_section">
          <h1 className="heading">POPULAR DISHES</h1>
          <p>
            Tap a dish image to add it; multiple taps increase quantity. Use the Combo button to pick any combo for that dish.
          </p>
        </div>

        <div className="dishes_container">
          {dishes.map((dish) => {
            const sel = selectedComboByDish[dish.id] || null;
            const price = dish.price + (sel ? sel.extraPrice : 0);

            return (
              <div className="card" key={dish.id} style={{ cursor: "default" }}>
                <img
                  src={dish.image}
                  alt={dish.title}
                  onClick={() => onTapImage(dish)}
                  style={{ cursor: "pointer" }}
                  title="Tap to add"
                />
                <h3>{dish.title}</h3>
                <p>Price: ${price.toFixed(2)}</p>
                <button>{dish.category}</button>

                <div style={{ marginTop: 8 }}>
                  <details onToggle={(e) => { if (e.target.open) loadTopCombos(dish.id); }}>
                    <summary>Combo</summary>
                    <div style={{ marginTop: 8, textAlign: "left" }}>
                      {topCombosByDish[dish.id]?.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <strong>Recommended for this dish</strong>
                          <ul style={{ marginLeft: 18 }}>
                            {topCombosByDish[dish.id].map((r) => (
                              <li key={`rec-${r.comboId}`}>
                                {r.comboName} ({r.count})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p style={{ marginBottom: 6 }}>Choose combo for this dish:</p>
                      {combos.map((c) => {
                        const isRecommended = !!topCombosByDish[dish.id]?.find((r) => r.comboId === c.comboId);
                        return (
                          <div key={c.comboId} style={{ marginBottom: 6 }}>
                            <label>
                              <input
                                type="radio"
                                name={`combo-${dish.id}`}
                                checked={sel?.comboId === c.comboId}
                                onChange={() => handleSelectCombo(dish.id, c)}
                              />{" "}
                              {c.comboName} (+${c.extraPrice.toFixed(2)}){isRecommended ? " — Recommended" : ""}
                            </label>
                          </div>
                        );
                      })}
                      <div>
                        <button onClick={() => handleSelectCombo(dish.id, null)}>
                          No Combo
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "20px" }}>
          <h2>Your Cart ({cart.length} items)</h2>
          {cart.length === 0 ? (
            <p>No items selected yet.</p>
          ) : (
            <div className="cart-card-list">
              {cart.map((item) => (
                <div className="cart-card" key={item.lineKey}>
                  <div className="cart-left">
                    <div className="cart-title">
                      {item.title}
                      {item.comboName ? ` + ${item.comboName}` : ""}
                    </div>
                    <div className="cart-meta">
                      Qty: <span className="pill">{item.qty}</span>
                      <span className="dot">•</span>
                      Price: ${Number(item.price || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="cart-actions">
                    <button
                      className="btn btn-ghost"
                      onClick={() => removeFromCart(item.lineKey)}
                      aria-label={`Remove ${item.title}`}
                      title="Remove"
                    >
                      ✖
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link to="/order">
            <button className="btn btn-primary" disabled={cart.length === 0}>
              Go to Cart / Place Order
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Menu;
