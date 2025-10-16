
import ReadingList from '../models/ReadingList.js';

export const createReadingList = async (listData, user) => {
  const { name, description, isPublic } = listData;
  const readingList = await ReadingList.create({
    owner: user._id,
    name,
    description,
    isPublic,
  });
  return readingList;
};

export const getMyReadingLists = async (user) => {
  const readingLists = await ReadingList.find({ owner: user._id })
    .populate('items.paper')
    .lean();

  // Transform the data to match frontend expectations (items -> papers)
  const transformedLists = readingLists.map(list => {
    const { items, ...rest } = list;
    return {
      ...rest,
      papers: items.map(item => item.paper).filter(Boolean) // a. get the paper, b. filter out null/undefined if a paper was deleted
    };
  });

  return transformedLists;
};

export const getReadingListById = async (id, user) => {
  const readingList = await ReadingList.findById(id).populate('items.paper');
  if (!readingList) {
    throw new Error('Reading list not found');
  }
  if (!readingList.isPublic && readingList.owner.toString() !== user._id.toString()) {
    throw new Error('Not authorized to view this reading list');
  }
  return readingList;
};

export const updateReadingList = async (id, listData, user) => {
  const readingList = await ReadingList.findById(id);
  if (!readingList) {
    throw new Error('Reading list not found');
  }
  if (readingList.owner.toString() !== user._id.toString()) {
    throw new Error('Not authorized to update this reading list');
  }
  Object.assign(readingList, listData);
  await readingList.save();
  return readingList;
};

export const deleteReadingList = async (id, user) => {
  const readingList = await ReadingList.findById(id);
  if (!readingList) {
    throw new Error('Reading list not found');
  }
  if (readingList.owner.toString() !== user._id.toString()) {
    throw new Error('Not authorized to delete this reading list');
  }
  await readingList.remove();
  return readingList;
};

export const addPaperToReadingList = async (listId, paperId, user) => {
  const readingList = await ReadingList.findById(listId);
  if (!readingList) {
    throw new Error('Reading list not found');
  }
  if (readingList.owner.toString() !== user._id.toString()) {
    throw new Error('Not authorized to modify this reading list');
  }
  if (readingList.items.some(item => item.paper.toString() === paperId)) {
    throw new Error('Paper already in this reading list');
  }
  readingList.items.push({ paper: paperId });
  await readingList.save();
  return readingList;
};

export const removePaperFromReadingList = async (listId, paperId, user) => {
  const readingList = await ReadingList.findById(listId);
  if (!readingList) {
    throw new Error('Reading list not found');
  }
  if (readingList.owner.toString() !== user._id.toString()) {
    throw new Error('Not authorized to modify this reading list');
  }
  readingList.items = readingList.items.filter(item => item.paper.toString() !== paperId);
  await readingList.save();
  return readingList;
};
