
import mongoose from 'mongoose';

const readingListSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  isPublic: { type: Boolean, default: false },
  items: [{
    paper: { type: mongoose.Schema.Types.ObjectId, ref: 'Paper', required: true },
    addedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

const ReadingList = mongoose.model('ReadingList', readingListSchema);

export default ReadingList;
