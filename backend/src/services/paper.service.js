import Paper from '../models/Paper.js';
import Artifact from '../models/Artifact.js';
import fs from 'fs';

// Helper function to safely convert a comma-separated string to a trimmed array
const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    return value.split(',').map(item => item.trim());
  }
  return [];
};

// Helper function to safely parse specific date formats
const parseFlexibleDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  // Check for YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) return date;
  }
  // Check for YYYY
  if (/^\d{4}$/.test(dateString)) {
    const date = new Date(`${dateString}-01-01T00:00:00`);
    if (!isNaN(date.getTime())) return date;
  }
  // Return null for any other format
  return null;
};

const reconstructArtifacts = (body) => {
  const artifacts = [];

  // Convert body to plain object if needed (handles null prototype objects)
  const plainBody = {};
  for (const key in body) {
    plainBody[key] = body[key];
  }

  console.log('Plain body keys:', Object.keys(plainBody));

  // Check if artifacts is sent as an array directly (JSON parsed by multer)
  if (plainBody.artifacts && Array.isArray(plainBody.artifacts)) {
    console.log('Artifacts sent as array:', plainBody.artifacts);
    plainBody.artifacts.forEach((artifact, index) => {
      // Convert null prototype object to plain object
      const plainArtifact = {};
      for (const key in artifact) {
        plainArtifact[key] = artifact[key];
      }

      if (plainArtifact.type && plainArtifact.sourceType) {
        artifacts.push({
          index: index,
          type: plainArtifact.type,
          name: plainArtifact.name || '',
          sourceType: plainArtifact.sourceType,
          value: plainArtifact.value
        });
      }
    });
    return artifacts;
  }

  // Fallback: Check for flat key-value format (artifacts[0][type], etc.)
  const artifactIndices = Object.keys(plainBody)
    .map(key => {
      const match = key.match(/^artifacts\[(\d+)\]\[type\]$/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter(index => index !== null)
    .sort((a, b) => a - b);

  const uniqueIndices = [...new Set(artifactIndices)];
  console.log('Found artifact indices:', uniqueIndices);

  for (const index of uniqueIndices) {
    const type = plainBody[`artifacts[${index}][type]`];
    const name = plainBody[`artifacts[${index}][name]`];
    const sourceType = plainBody[`artifacts[${index}][sourceType]`];
    const value = plainBody[`artifacts[${index}][value]`];

    console.log(`Artifact ${index}:`, { type, name, sourceType, value });

    if (type) {
      artifacts.push({
        index: index,
        type: type,
        name: name || '',
        sourceType: sourceType,
        value: value
      });
    }
  }
  return artifacts;
};

export const createPaperWithArtifacts = async (body, files, user) => {
  console.log('=== CREATE PAPER WITH ARTIFACTS ===');
  console.log('Body:', body);
  console.log('Files:', files);

  const { title, abstract, authors, institution, keywords, publicationDate, categories, isPublic } = body;

  const paperFile = files.find(f => f.fieldname === 'paperFile');
  if (!paperFile) {
    throw new Error('Paper file is required.');
  }

  const paperData = {
    owner: user._id,
    title,
    abstract,
    authors: toArray(authors),
    institution,
    keywords: toArray(keywords),
    categories: toArray(categories),
    isPublic: isPublic === 'true',
    file: {
      path: paperFile.path,
      filename: paperFile.filename,
      mimetype: paperFile.mimetype,
      size: paperFile.size,
    },
  };

  const parsedDate = parseFlexibleDate(publicationDate);
  if (parsedDate) {
    paperData.publicationDate = parsedDate;
  }

  const paper = new Paper(paperData);
  const savedPaper = await paper.save();

  const artifactDataList = reconstructArtifacts(body);
  console.log('Reconstructed artifacts:', artifactDataList);
  const createdArtifacts = [];

  for (const artifactData of artifactDataList) {
    console.log('Processing artifact:', artifactData);

    const newArtifactPayload = {
      paper: savedPaper._id,
      type: artifactData.type,
      name: artifactData.name,
      sourceType: artifactData.sourceType,
    };

    if (artifactData.sourceType === 'link') {
      newArtifactPayload.url = artifactData.value;
      console.log('Artifact is link with URL:', newArtifactPayload.url);
    } else if (artifactData.sourceType === 'file') {
      const artifactFile = files.find(f => f.fieldname === `artifacts[${artifactData.index}][value]`);
      console.log('Looking for file with fieldname:', `artifacts[${artifactData.index}][value]`);
      console.log('Found artifact file:', artifactFile);
      if (artifactFile) {
        newArtifactPayload.file = {
          path: artifactFile.path,
          filename: artifactFile.filename,
          mimetype: artifactFile.mimetype,
          size: artifactFile.size,
        };
      }
    }

    console.log('Final artifact payload:', newArtifactPayload);

    if (newArtifactPayload.type && newArtifactPayload.sourceType) {
      // Check if artifact has valid data (either url or file)
      if ((newArtifactPayload.sourceType === 'link' && newArtifactPayload.url) ||
          (newArtifactPayload.sourceType === 'file' && newArtifactPayload.file)) {
        const artifact = new Artifact(newArtifactPayload);
        const savedArtifact = await artifact.save();
        console.log('Saved artifact:', savedArtifact);
        createdArtifacts.push(savedArtifact);
      } else {
        console.log('Skipping artifact - no valid url or file');
      }
    } else {
      console.log('Skipping artifact - missing type or sourceType');
    }
  }

  console.log('Total artifacts created:', createdArtifacts.length);

  await savedPaper.populate('owner', 'name email');
  return { ...savedPaper.toObject(), artifacts: createdArtifacts };
};

export const updatePaperWithArtifacts = async (id, body, files, user) => {
  const paper = await Paper.findById(id);

  if (!paper) {
    throw new Error('Paper not found');
  }

  if (paper.owner.toString() !== user._id.toString() && user.role !== 'admin') {
    throw new Error('Not authorized to update this paper');
  }

  if (body.title) paper.title = body.title;
  if (body.abstract) paper.abstract = body.abstract;
  if (body.authors) paper.authors = toArray(body.authors);
  if (body.keywords) paper.keywords = toArray(body.keywords);
  if (body.categories) paper.categories = toArray(body.categories);
  if (body.publicationDate) {
    const parsedDate = parseFlexibleDate(body.publicationDate);
    if (parsedDate) paper.publicationDate = parsedDate;
  }
  if (body.isPublic !== undefined) paper.isPublic = body.isPublic === 'true';

  const paperFile = files.find(f => f.fieldname === 'paperFile');
  if (paperFile) {
    if (paper.file && paper.file.path) {
      fs.unlink(paper.file.path, (err) => {
        if (err) console.error(`Failed to delete old paper file: ${paper.file.path}`, err);
      });
    }
    paper.file = {
      path: paperFile.path,
      filename: paperFile.filename,
      mimetype: paperFile.mimetype,
      size: paperFile.size,
    };
  }

  const oldArtifacts = await Artifact.find({ paper: paper._id });
  for (const artifact of oldArtifacts) {
    if (artifact.sourceType === 'file' && artifact.file && artifact.file.path) {
      fs.unlink(artifact.file.path, (err) => {
        if (err) console.error(`Failed to delete artifact file: ${artifact.file.path}`, err);
      });
    }
  }
  await Artifact.deleteMany({ paper: paper._id });

  const artifactDataList = reconstructArtifacts(body);
  const createdArtifacts = [];

  for (const artifactData of artifactDataList) {
    const newArtifactPayload = {
      paper: paper._id,
      type: artifactData.type,
      name: artifactData.name,
      sourceType: artifactData.sourceType,
    };

    if (artifactData.sourceType === 'link') {
      newArtifactPayload.url = artifactData.value;
    } else if (artifactData.sourceType === 'file') {
      const artifactFile = files.find(f => f.fieldname === `artifacts[${artifactData.index}][value]`);
      if (artifactFile) {
        newArtifactPayload.file = {
          path: artifactFile.path,
          filename: artifactFile.filename,
          mimetype: artifactFile.mimetype,
          size: artifactFile.size,
        };
      }
    }
    if (newArtifactPayload.type && newArtifactPayload.sourceType) {
      // Check if artifact has valid data (either url or file)
      if ((newArtifactPayload.sourceType === 'link' && newArtifactPayload.url) ||
          (newArtifactPayload.sourceType === 'file' && newArtifactPayload.file)) {
        const artifact = new Artifact(newArtifactPayload);
        const savedArtifact = await artifact.save();
        createdArtifacts.push(savedArtifact);
      } else {
        console.log('Skipping artifact - no valid url or file');
      }
    }
  }

  const updatedPaper = await paper.save();
  await updatedPaper.populate('owner', 'name email');
  return { ...updatedPaper.toObject(), artifacts: createdArtifacts };
};

export const getAllPapers = async (page = 1, limit = 10, q = '') => {
  const query = {};
  if (q) {
    query.$or = [
      { title: new RegExp(q, 'i') },
      { abstract: new RegExp(q, 'i') },
      { keywords: new RegExp(q, 'i') },
      { categories: new RegExp(q, 'i') },
    ];
  }

  const total = await Paper.countDocuments(query);
  const papers = await Paper.find(query)
    .populate('owner', 'name email')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalPages = Math.ceil(total / limit);

  return {
    papers,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages,
    hasNextPage: Number(page) < totalPages,
    hasPrevPage: Number(page) > 1,
  };
};

export const getPaperById = async (id) => {
  const paper = await Paper.findById(id).populate('owner', 'name email');
  if (paper) {
    paper.viewCount++;
    await paper.save();
  }
  return paper;
};

export const downloadPaper = async (id) => {
  const paper = await Paper.findById(id);
  if (paper) {
    paper.downloadCount++;
    await paper.save();
  }
  return paper;
};

export const addVersion = async (id, file, note, user) => {
  const paper = await Paper.findById(id);

  if (!paper) {
    throw new Error('Paper not found');
  }

  if (paper.owner.toString() !== user._id.toString() && user.role !== 'admin') {
    throw new Error('Not authorized to add a version to this paper');
  }

  paper.versions.push({
    path: file.path,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    note: note,
  });

  await paper.save();
  return paper;
};

export const deletePaper = async (id, user) => {
  const paper = await Paper.findById(id);

  if (!paper) {
    throw new Error('Paper not found');
  }

  if (paper.owner.toString() !== user._id.toString() && user.role !== 'admin') {
    throw new Error('Not authorized to delete this paper');
  }

  const artifacts = await Artifact.find({ paper: paper._id });
  for (const artifact of artifacts) {
    if (artifact.sourceType === 'file' && artifact.file && artifact.file.path) {
      fs.unlink(artifact.file.path, (err) => {
        if (err) console.error(`Failed to delete artifact file: ${artifact.file.path}`, err);
      });
    }
  }
  await Artifact.deleteMany({ paper: paper._id });

  if (paper.file && paper.file.path) {
    fs.unlink(paper.file.path, (err) => {
      if (err) console.error(`Failed to delete paper file: ${paper.file.path}`, err);
    });
  }

  await paper.deleteOne();
  return paper;
};
