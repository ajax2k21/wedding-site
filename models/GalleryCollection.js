import mongoose from 'mongoose';

const GalleryCollectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Collection name is required'],
      trim: true,
      maxlength: [60, 'Collection name cannot exceed 60 characters'],
    },
    order: {
      type: Number,
      default: 0,
    },
    side: {
      type: String,
      enum: ['bride', 'groom'],
      default: 'bride',
      index: true,
    },
  },
  { timestamps: true }
);

const GalleryCollection =
  mongoose.models.GalleryCollection || mongoose.model('GalleryCollection', GalleryCollectionSchema);

export default GalleryCollection;
