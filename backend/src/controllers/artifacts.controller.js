
import * as artifactService from '../services/artifact.service.js';
import { sendSuccess, sendError } from '../utils/responses.js';
import path from 'path';

export const createArtifact = async (req, res, next) => {
  try {
    const artifact = await artifactService.createArtifact(req.params.paperId, req.body, req.file, req.user);
    sendSuccess(res, 201, artifact);
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

export const getArtifactsForPaper = async (req, res, next) => {
  try {
    const artifacts = await artifactService.getArtifactsForPaper(req.params.paperId);
    sendSuccess(res, 200, artifacts);
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

export const getArtifactById = async (req, res, next) => {
  try {
    const artifact = await artifactService.getArtifactById(req.params.id);
    if (!artifact) {
      return sendError(res, 404, 'Artifact not found');
    }
    sendSuccess(res, 200, artifact);
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

export const downloadArtifact = async (req, res, next) => {
    try {
        const artifact = await artifactService.downloadArtifact(req.params.id);
        if (!artifact) {
            return sendError(res, 404, 'Artifact not found');
        }
        if (artifact.file && artifact.file.path) {
            res.download(path.resolve(artifact.file.path), artifact.file.filename);
        } else if (artifact.externalRepoUrl) {
            res.redirect(artifact.externalRepoUrl);
        } else {
            return sendError(res, 404, 'No downloadable content for this artifact');
        }
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

export const updateArtifact = async (req, res, next) => {
  try {
    const artifact = await artifactService.updateArtifact(req.params.id, req.body, req.user);
    sendSuccess(res, 200, artifact);
  } catch (error) {
    if (error.message.startsWith('Not authorized')) {
      return sendError(res, 403, error.message);
    }
    if (error.message === 'Artifact not found') {
      return sendError(res, 404, error.message);
    }
    sendError(res, 500, error.message);
  }
};

export const deleteArtifact = async (req, res, next) => {
  try {
    await artifactService.deleteArtifact(req.params.id, req.user);
    sendSuccess(res, 200, { message: 'Artifact deleted' });
  } catch (error) {
    if (error.message.startsWith('Not authorized')) {
      return sendError(res, 403, error.message);
    }
    if (error.message === 'Artifact not found') {
      return sendError(res, 404, error.message);
    }
    sendError(res, 500, error.message);
  }
};
