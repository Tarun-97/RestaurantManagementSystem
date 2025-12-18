import ErrorHandler from "../middlewares/error.js";
import Order from "../models/order.js";

export const placeOrder = async (req, res, next) => {
  const { firstName, phone, email, items, total, notes } = req.body;

  if (!firstName || !phone || !items || !Array.isArray(items) || items.length === 0) {
    return next(
      new ErrorHandler(
        "Missing required fields: firstName, phone, and at least one item.",
        400
      )
    );
  }

  try {
    const order = await Order.create({
      firstName,
      phone,
      email: email || undefined,
      items,
      total,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order,
    });
  } catch (error) {
    return next(error);
  }
};

export const recommendCombo = async (req, res, next) => {
  const { dishId } = req.query;
  if (!dishId) {
    return res
      .status(400)
      .json({ success: false, message: "dishId is required", suggestion: null });
  }

  try {
    const agg = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.menuId": String(dishId), "items.comboId": { $ne: null } } },
      {
        $group: {
          _id: { comboId: "$items.comboId", comboName: "$items.comboName" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    if (agg.length === 0) {
      return res.status(200).json({ success: true, suggestion: null });
    }

    const top = agg[0];
    const suggestion = {
      dishId: String(dishId),
      dishName: null,
      comboId: top._id.comboId,
      comboName: top._id.comboName,
      count: top.count,
      avgExtra: 0,
    };

    return res.status(200).json({ success: true, suggestion });
  } catch (error) {
    return next(error);
  }
};

export const recommendTop3 = async (req, res, next) => {
  const { dishId } = req.query;
  if (!dishId) {
    return res
      .status(400)
      .json({ success: false, message: "dishId is required", suggestions: [] });
  }
  try {
    const agg = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.menuId": String(dishId), "items.comboId": { $ne: null } } },
      {
        $group: {
          _id: { comboId: "$items.comboId", comboName: "$items.comboName" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    const suggestions = agg.map((r) => ({
      comboId: r._id.comboId,
      comboName: r._id.comboName,
      count: r.count,
    }));

    return res.status(200).json({ success: true, suggestions });
  } catch (e) {
    return next(e);
  }
};
