import * as paperService from '../services/paper.service.js';
import { sendSuccess, sendError } from '../utils/responses.js';
import path from 'path';
import Artifact from '../models/Artifact.js';

export const createPaper = async (req, res, next) => {
  try {
    const paper = await paperService.createPaperWithArtifacts(req.body, req.files, req.user);
    sendSuccess(res, 201, paper);
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

export const createPapersFromBib = async (req, res, next) => {
  try {
    const papers = await paperService.createPapersFromBib(req.body, req.user);
    sendSuccess(res, 201, papers);
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

export const getPapers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, q } = req.query;
    const papers = await paperService.getAllPapers(page, limit, q);
    sendSuccess(res, 200, papers);
  } catch (error) {
    console.error('Error in getPapers controller:', error);
    sendError(res, 500, error.message);
  }
};

export const getPaperById = async (req, res, next) => {
  try {
    const paper = await paperService.getPaperById(req.params.id);
    if (!paper) {
      return sendError(res, 404, 'Paper not found');
    }
    // Manually populate artifacts
    const artifacts = await Artifact.find({ paper: paper._id });
    sendSuccess(res, 200, { ...paper.toObject(), artifacts });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

export const downloadPaper = async (req, res, next) => {
    try {
        const paper = await paperService.downloadPaper(req.params.id);
        if (!paper) {
            return sendError(res, 404, 'Paper not found');
        }
        const filePath = path.join(process.cwd(), paper.file.path);
        res.download(filePath, paper.file.filename);
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

export const updatePaper = async (req, res, next) => {
  try {
    const paper = await paperService.updatePaperWithArtifacts(req.params.id, req.body, req.files, req.user);
    sendSuccess(res, 200, paper);
  } catch (error) {
    if (error.message.startsWith('Not authorized')) {
      return sendError(res, 403, error.message);
    }
    if (error.message === 'Paper not found') {
      return sendError(res, 404, error.message);
    }
    sendError(res, 500, error.message);
  }
};

export const addVersion = async (req, res, next) => {
  try {
    const paper = await paperService.addVersion(req.params.id, req.file, req.body.note, req.user);
    sendSuccess(res, 200, paper);
  } catch (error) {
    if (error.message.startsWith('Not authorized')) {
      return sendError(res, 403, error.message);
    }
    if (error.message === 'Paper not found') {
      return sendError(res, 404, error.message);
    }
    sendError(res, 500, error.message);
  }
};

export const deletePaper = async (req, res, next) => {
  try {
    await paperService.deletePaper(req.params.id, req.user);
    sendSuccess(res, 200, { message: 'Paper deleted' });
  } catch (error) {
    console.error('Error in deletePaper controller:', error);
    if (error.message.startsWith('Not authorized')) {
      return sendError(res, 403, error.message);
    }
    if (error.message === 'Paper not found') {
      return sendError(res, 404, error.message);
    }
    sendError(res, 500, error.message);
  }
};
