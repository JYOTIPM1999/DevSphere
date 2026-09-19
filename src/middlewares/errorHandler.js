export const errorHandler = (err, req, res, next) => {
  console.error("error found", err.stack);
  // Intercept Zod validation errors to send a clean 400 Bad Request
  if (err.name === "ZodError") {
    const issues = err.issues || err.errors || [];
    return res.status(400).json({
      success: false,
      error: issues.map((e) => e.message).join(", ") || err.message,
    });
  }
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    error: err.message || "Server Error",
  });
};
