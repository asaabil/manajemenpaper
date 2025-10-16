
import mongoose from 'mongoose';

const paperSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  abstract: { type: String, required: true },
  authors: [{ type: String }],
  institution: { type: String },
  keywords: [{ type: String }],
  publicationDate: { type: Date },
  categories: [{ type: String }],
  file: {
    path: { type: String, required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
  },
  versions: [{
    path: { type: String, required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    note: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  viewCount: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true },
}, { timestamps: true });

paperSchema.index({ title: 'text', abstract: 'text', authors: 'text', institution: 'text', keywords: 'text', categories: 'text' });
paperSchema.index({ owner: 1 });

const Paper = mongoose.model('Paper', paperSchema);

export default Paper;
