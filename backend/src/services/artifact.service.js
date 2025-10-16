
import Artifact from '../models/Artifact.js';
import Paper from '../models/Paper.js';

export const createArtifact = async (paperId, artifactData, file, user) => {
  const paper = await Paper.findById(paperId);
  if (!paper) {
    throw new Error('Paper not found');
  }

  if (paper.owner.toString() !== user._id.toString() && user.role !== 'admin') {
    throw new Error('Not authorized to add an artifact to this paper');
  }

  const { name, description, type, technology, language, methodology, externalRepoUrl, isPublic } = artifactData;

  const artifact = await Artifact.create({
    paper: paperId,
    name,
    description,
    type,
    technology,
    language,
    methodology,
    externalRepoUrl,
    isPublic,
    file: file ? {
      path: file.path,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    } : undefined,
  });

  return artifact;
};

export const getArtifactsForPaper = async (paperId) => {
  const artifacts = await Artifact.find({ paper: paperId });
  return artifacts;
};

export const getArtifactById = async (id) => {
  const artifact = await Artifact.findById(id);
  return artifact;
};

export const downloadArtifact = async (id) => {
    const artifact = await Artifact.findById(id);
    if (artifact) {
        artifact.downloadCount++;
        await artifact.save();
    }
    return artifact;
};

export const updateArtifact = async (id, artifactData, user) => {
  const artifact = await Artifact.findById(id).populate('paper');

  if (!artifact) {
    throw new Error('Artifact not found');
  }

  if (artifact.paper.owner.toString() !== user._id.toString() && user.role !== 'admin') {
    throw new Error('Not authorized to update this artifact');
  }

  Object.assign(artifact, artifactData);
  await artifact.save();
  return artifact;
};

export const deleteArtifact = async (id, user) => {
  const artifact = await Artifact.findById(id).populate('paper');

  if (!artifact) {
    throw new Error('Artifact not found');
  }

  if (artifact.paper.owner.toString() !== user._id.toString() && user.role !== 'admin') {
    throw new Error('Not authorized to delete this artifact');
  }

  await artifact.remove();
  return artifact;
};
