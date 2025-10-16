
import * as searchService from '../services/search.service.js';
import { sendSuccess, sendError } from '../utils/responses.js';

export const search = async (req, res, next) => {
  try {
    const results = await searchService.search(req.query);
    sendSuccess(res, 200, results);
  } catch (error) {
    sendError(res, 400, error.message);
  }
};
