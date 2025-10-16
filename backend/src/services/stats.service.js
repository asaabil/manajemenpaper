
import Paper from '../models/Paper.js';

export const getTopDownloadedPapers = async () => {
  const papers = await Paper.find().sort({ downloadCount: -1 }).limit(10);
  return papers;
};

export const getTopViewedPapers = async () => {
  const papers = await Paper.find().sort({ viewCount: -1 }).limit(10);
  return papers;
};
