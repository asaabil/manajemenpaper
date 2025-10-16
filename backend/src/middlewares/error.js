
import { sendError } from '../utils/responses.js';

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return sendError(res, 400, err.message);
  }

  if (err.name === 'CastError') {
    return sendError(res, 400, `Invalid ${err.path}: ${err.value}`);
  }

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 400, 'File size is too large.');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return sendError(res, 400, 'Unexpected file field.');
  }

  sendError(res, 500, 'Internal Server Error');
};

export default errorHandler;
