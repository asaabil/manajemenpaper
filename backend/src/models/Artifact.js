import mongoose from 'mongoose';

const artifactSchema = new mongoose.Schema({
  paper: { type: mongoose.Schema.Types.ObjectId, ref: 'Paper', required: true },
  type: {
    type: String,
    enum: ['dataset', 'source_code', 'diagram', 'other'],
    required: true,
  },
  name: {
    type: String,
    required: function() { return this.type === 'other'; }, // Required only if type is 'other'
  },
  sourceType: {
    type: String,
    enum: ['file', 'link'],
    required: true,
  },
  // Fields for sourceType: 'file'
  file: {
    path: { type: String },
    filename: { type: String },
    mimetype: { type: String },
    size: { type: Number },
  },
  // Field for sourceType: 'link'
  url: {
    type: String,
  },
}, { timestamps: true });

artifactSchema.index({ paper: 1 });

const Artifact = mongoose.model('Artifact', artifactSchema);

export default Artifact;