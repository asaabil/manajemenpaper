
import * as readingListService from '../services/readingList.service.js';
import { sendSuccess, sendError } from '../utils/responses.js';

export const createReadingList = async (req, res, next) => {
  try {
    const list = await readingListService.createReadingList(req.body, req.user);
    sendSuccess(res, 201, list);
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

export const getMyReadingLists = async (req, res, next) => {
  try {
    const lists = await readingListService.getMyReadingLists(req.user);
    sendSuccess(res, 200, lists);
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

export const getReadingListById = async (req, res, next) => {
  try {
    const list = await readingListService.getReadingListById(req.params.id, req.user);
    sendSuccess(res, 200, list);
  } catch (error) {
    if (error.message.startsWith('Not authorized')) {
      return sendError(res, 403, error.message);
    }
    if (error.message === 'Reading list not found') {
      return sendError(res, 404, error.message);
    }
    sendError(res, 500, error.message);
  }
};

export const updateReadingList = async (req, res, next) => {
  try {
    const list = await readingListService.updateReadingList(req.params.id, req.body, req.user);
    sendSuccess(res, 200, list);
  } catch (error) {
    if (error.message.startsWith('Not authorized')) {
      return sendError(res, 403, error.message);
    }
    if (error.message === 'Reading list not found') {
      return sendError(res, 404, error.message);
    }
    sendError(res, 500, error.message);
  }
};

export const deleteReadingList = async (req, res, next) => {
  try {
    await readingListService.deleteReadingList(req.params.id, req.user);
    sendSuccess(res, 200, { message: 'Reading list deleted' });
  } catch (error) {
    if (error.message.startsWith('Not authorized')) {
      return sendError(res, 403, error.message);
    }
    if (error.message === 'Reading list not found') {
      return sendError(res, 404, error.message);
    }
    sendError(res, 500, error.message);
  }
};

export const addPaperToReadingList = async (req, res, next) => {
  try {
    const list = await readingListService.addPaperToReadingList(req.params.id, req.body.paperId, req.user);
    sendSuccess(res, 200, list);
  } catch (error) {
    if (error.message.startsWith('Not authorized')) {
      return sendError(res, 403, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    sendError(res, 400, error.message);
  }
};

export const removePaperFromReadingList = async (req, res, next) => {
  try {
    const list = await readingListService.removePaperFromReadingList(req.params.id, req.params.paperId, req.user);
    sendSuccess(res, 200, list);
  } catch (error) {
    if (error.message.startsWith('Not authorized')) {
      return sendError(res, 403, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    sendError(res, 400, error.message);
  }
};
