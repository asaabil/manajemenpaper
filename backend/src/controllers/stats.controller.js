
import * as statsService from '../services/stats.service.js';
import { sendSuccess, sendError } from '../utils/responses.js';

export const getTopDownloadedPapers = async (req, res, next) => {
  try {
    const papers = await statsService.getTopDownloadedPapers();
    sendSuccess(res, 200, papers);
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

export const getTopViewedPapers = async (req, res, next) => {
  try {
    const papers = await statsService.getTopViewedPapers();
    sendSuccess(res, 200, papers);
  } catch (error) {
    sendError(res, 500, error.message);
  }
};
