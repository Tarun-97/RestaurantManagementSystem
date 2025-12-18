class ErrorHandler extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ErrorHandler);
    }
  }
}

export const errorMiddleware = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const name = err.name || "Error";
  let message = err.message || "Internal Server Error";

  if (name === "CastError") {
    message = `Resource not found. Invalid ${err.path}.`;
    return res.status(400).json({ success: false, message });
  }

  if (name === "ValidationError" && err.errors) {
    const validationErrors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: validationErrors.join(", "),
    });
  }

  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    message =
      fields.length > 0
        ? `Duplicate value for field(s): ${fields.join(", ")}.`
        : "Duplicate key error.";
    return res.status(409).json({ success: false, message });
  }

  if (name === "SyntaxError" && err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON in request body.",
    });
  }

  return res.status(status).json({
    success: false,
    message,
  });
};

export default ErrorHandler;
