import mongoose from 'mongoose';

const GalleryPhotoSchema = new mongoose.Schema(
  {
    collection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GalleryCollection',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
      index: true,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [100, 'Caption cannot exceed 100 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

const GalleryPhoto = mongoose.models.GalleryPhoto || mongoose.model('GalleryPhoto', GalleryPhotoSchema);

export default GalleryPhoto;
