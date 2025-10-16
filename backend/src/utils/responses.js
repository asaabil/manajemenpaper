
export const sendSuccess = (res, statusCode, data) => {
  res.status(statusCode).json({
    success: true,
    data,
  });
};

export const sendError = (res, statusCode, message) => {
  res.status(statusCode).json({
    success: false,
    error: { message },
  });
};
