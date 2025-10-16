import multer from 'multer';
import path from 'path';
import fs from 'fs';
import env from '../config/env.js';

const paperDir = path.join(env.uploadDir, 'papers');
const artifactDir = path.join(env.uploadDir, 'artifacts');

// Ensure directories exist
fs.mkdirSync(paperDir, { recursive: true });
fs.mkdirSync(artifactDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'paperFile') {
      cb(null, paperDir);
    } else if (file.fieldname.startsWith('artifacts')) {
      cb(null, artifactDir);
    } else {
      cb(new Error('Invalid fieldname for file upload'), null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname.replace(/\[|\]/g, '') + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'paperFile') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid paper file type. Only PDF is allowed.'), false);
    }
  } else if (file.fieldname.startsWith('artifacts')) {
    // For now, allow any file type for artifacts. Validation can be added later.
    cb(null, true);
  } else {
    cb(null, false);
  }
};

export const uploadPaperWithArtifacts = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 50 } // 50MB limit per file
});

// Keep uploadPaper for versioning
export const uploadPaper = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, paperDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'version-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid paper file type. Only PDF is allowed.'), false);
    }
  },
  limits: { fileSize: 1024 * 1024 * 10 } // 10MB
});

// Keep uploadArtifact for potential direct artifact uploads
export const uploadArtifact = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, artifactDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'artifact-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 1024 * 1024 * 50 } // 50MB
});