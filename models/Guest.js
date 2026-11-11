import mongoose from 'mongoose';

const GuestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    status: {
      type: String,
      enum: ['yes', 'maybe', 'no'],
      required: [true, 'Attendance status is required'],
    },
    guestCount: {
      type: Number,
      default: 1,
      min: 0,
      max: 20,
    },
    message: {
      type: String,
      required: [true, 'A blessing message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

const Guest = mongoose.models.Guest || mongoose.model('Guest', GuestSchema);

export default Guest;
