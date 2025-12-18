import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    menuId: { type: String, required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    comboId: { type: String, default: null },
    comboName: { type: String, default: null },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, minLength: 2 },
    phone: { type: String, required: true },
    email: { type: String },
    items: { type: [orderItemSchema], required: true, validate: v => v.length > 0 },
    total: { type: Number, required: true, min: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ "items.menuId": 1, "items.comboId": 1 });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
