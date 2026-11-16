import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Please add a title for the issue"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please describe the problem in detail"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
      type: String,
      required: [true, "Please select an issue category"],
      enum: [
        "Roads & Potholes",
        "Sanitation & Garbage",
        "Electricity & Lighting",
        "Water Supply & Drainage",
        "Public Safety",
        "Other",
      ],
    },
    department: {
      type: String,
      default: "General Grievance Cell",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
   status: {
  type: String,
  enum: [
    "Reported",
    "Under-Review",
    "In-Progress",
    "Resolved",
    "Closed",
    "Reopened",
    "Escalated",
  ],
  default: "Reported",
},
    // GeoJSON Point format: [Longitude, Latitude]
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, "Please provide coordinates"],
      },
    },
    address: {
      type: String,
      required: [true, "Please provide the street/landmark address"],
    },
    images: {
      before: {
        type: [String],
        default: [],
      },
      after: {
        type: [String],
        default: [],
      },
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    slaDeadline: {
  type: Date,
},

verification: {
  status: {
    type: String,
    enum: ["Pending", "Verified", "Rejected"],
    default: "Pending",
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  comment: {
    type: String,
    default: "",
  },
  verifiedAt: {
    type: Date,
  },
},

timeline: [
      {
        status: { type: String, required: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        comment: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// 1. Enable 2dsphere index for radius / proximity searches
issueSchema.index({ location: "2dsphere" });

// 2. Pre-save hook: auto-generate Ticket ID and 48-hour SLA deadline
issueSchema.pre("save", async function () {
  if (!this.ticketId) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.ticketId = `CV-${randomNum}`;
  }

  if (!this.slaDeadline) {
    const hours = this.priority === "Critical" ? 24 : 48;
    this.slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);
  }
});

const Issue = mongoose.model("Issue", issueSchema);
export default Issue;