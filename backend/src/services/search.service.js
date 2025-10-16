import Paper from '../models/Paper.js';
import env from '../config/env.js';

/**
 * Searches for papers using different strategies based on the environment configuration.
 * This allows for flexible debugging and adaptation to different MongoDB environments
 * (e.g., local instance vs. MongoDB Atlas).
 *
 * @param {object} queryParams - The query parameters from the request.
 * @param {string} queryParams.q - The search term.
 * @param {number} [queryParams.page=1] - The page number for pagination.
 * @param {number} [queryParams.limit=10] - The number of results per page.
 * @returns {Promise<Array>} - A promise that resolves to an array of found papers.
 */
export const search = async (queryParams) => {
  const { q, page = 1, limit = 10 } = queryParams;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  // If there's no search query, return an empty array immediately.
  if (!q) {
    return [];
  }

  const strategy = env.searchStrategy || 'regex'; // Default to 'regex' if not specified

  console.log(`Using search strategy: ${strategy}`);

  switch (strategy) {
    // --- Atlas Search Strategy ---
    // The most powerful option, requires a MongoDB Atlas cluster and a pre-configured Search Index.
    // Handles short words, typos (fuzzy search), and provides relevance scoring.
    case 'atlas':
      const atlasPipeline = [
        {
          $search: {
            index: 'default', // Assumes the search index is named 'default'
            text: {
              query: q,
              path: ['title', 'abstract', 'authors', 'keywords', 'categories'],
              fuzzy: { // (Opsional) Mengizinkan salah ketik
                maxEdits: 1,
              },
            },
          },
        },
        {
          $project: { // Shape the output
            _id: 1,
            title: 1,
            abstract: 1,
            authors: 1,
            publicationDate: 1,
            isPublic: 1,
            score: { $meta: 'searchScore' }, // Include the relevance score
          },
        },
        { $sort: { score: -1 } }, // Sort by relevance
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum },
      ];
      return await Paper.aggregate(atlasPipeline);

    // --- Basic Text Index Strategy ---
    // Uses MongoDB's built-in text search. Requires a text index on the collection.
    // May not work well for very short words (e.g., "AI") as they can be treated as stop words.
    case 'text':
      return await Paper.find(
        { $text: { $search: q } },
        { score: { $meta: 'textScore' } } // Project the text search score
      )
      .sort({ score: { $meta: 'textScore' } }) // Sort by relevance
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // --- Regex Strategy (Default) ---
    // A robust fallback that works on any MongoDB instance without special indexes.
    // It performs a case-insensitive search across multiple fields. Can be slower on large datasets.
    case 'regex':
    default:
      const searchRegex = new RegExp(q, 'i'); // 'i' for case-insensitive
      return await Paper.find({
        $or: [
          { title: searchRegex },
          { abstract: searchRegex },
          { authors: searchRegex },
          { keywords: searchRegex },
          { categories: searchRegex },
        ],
      })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
  }
};