
import ReadingList from '../models/ReadingList.js';

export const createReadingList = async (listData, user) => {
  const { name, description, isPublic } = listData;
  
  // Restriction: Only 'dosen' or 'admin' can create public lists.
  // 'mahasiswa' can only create private ones.
  const requestedPublic = isPublic === true || isPublic === 'true';
  const canBePublic = user.role === 'dosen' || user.role === 'admin';
  const finalIsPublic = canBePublic ? requestedPublic : false;

  const readingList = await ReadingList.create({
    owner: user._id,
    name,
    description,
    isPublic: finalIsPublic,
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

export const getPublicReadingLists = async () => {
  const readingLists = await ReadingList.find({ isPublic: true })
    .populate('owner', 'name email role')
    .populate('items.paper')
    .lean();

  // Transform the data to match frontend expectations (items -> papers)
  const transformedLists = readingLists.map(list => {
    const { items, ...rest } = list;
    return {
      ...rest,
      papers: items.map(item => item.paper).filter(Boolean)
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

  // Handle role-based restriction for public lists during update too
  if (listData.isPublic !== undefined) {
    const requestedPublic = listData.isPublic === true || listData.isPublic === 'true';
    const canBePublic = user.role === 'dosen' || user.role === 'admin';
    listData.isPublic = canBePublic ? requestedPublic : false;
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
  await readingList.deleteOne();
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
