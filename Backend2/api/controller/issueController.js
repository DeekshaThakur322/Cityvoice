import Issue from "../modal/issueSchema.js";

// @desc    Report a new issue
// @route   POST /api/issues
// @access  Private (Citizen/User must be logged in)
export const createIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      department,
      priority,
      longitude,
      latitude,
      address,
    } = req.body;
    // 1. Validation
    if (!title || !description || !category || !longitude || !latitude || !address) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields (title, description, category, location, address)",
      });
    }
    // 2. Extract Cloudinary Image URL (Multer saves it in req.file.path)
    let beforeImages = [];
    if (req.file && req.file.path) {
      beforeImages = [req.file.path]; // Permanent Cloudinary CDN URL!
    } else if (req.body.images) {
      // Fallback in case image was sent as a URL string
      beforeImages = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }
    // 3. Create the issue document in MongoDB
    const issue = await Issue.create({
      title,
      description,
      category,
      department: department || "General Grievance Redressal Cell",
      priority: priority || "Medium",
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)], // [lng, lat]
      },
      address,
      images: {
        before: beforeImages, // Clean Cloudinary URL saved!
        after: [],
      },
      reportedBy: req.user._id,
      timeline: [
        {
          status: "Reported",
          updatedBy: req.user._id,
          comment: "Issue has been reported by citizen with photographic proof.",
          timestamp: new Date(),
        },
      ],
    });
    res.status(201).json({
      success: true,
      message: "Issue reported successfully! ",
      data: issue,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error while creating issue",
    });
  }
};
// @desc    Get all reported issues (with optional filters)
// @route   GET /api/issues
// @access  Public
export const getAllIssues = async (req, res) => {
  try {
    const { category, status } = req.query;

    let filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;

    const issues = await Issue.find(filter)
      .populate("reportedBy", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching issues",
    });
  }
};

// @desc    Get issues reported by logged-in user
// @route   GET /api/issues/my
// @access  Private
export const getMyIssues = async (req, res) => {
  try {
    const issues = await Issue.find({
      reportedBy: req.user._id,
    })
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching your issues",
    });
  }
};

// @desc    Get issues near user's GPS coordinates
// @route   GET /api/issues/nearby?lng=...&lat=...&distance=5000
// @access  Public
export const getNearbyIssues = async (req, res) => {
  try {
    const { lng, lat, distance } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({
        success: false,
        message: "Please provide longitude (lng) and latitude (lat)",
      });
    }

    const maxDistanceInMeters = distance ? parseInt(distance) : 5000;

    const nearbyIssues = await Issue.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: maxDistanceInMeters,
        },
      },
    }).populate("reportedBy", "name email");

    res.status(200).json({
      success: true,
      count: nearbyIssues.length,
      data: nearbyIssues,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error in geospatial search",
    });
  }
};

// @desc    Toggle Upvote on an issue
// @route   PATCH /api/issues/:id/upvote
// @access  Private
export const toggleUpvote = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    const userId = req.user._id;
    const hasUpvoted = issue.upvotes.includes(userId);

    let updatedIssue;
    if (hasUpvoted) {
      updatedIssue = await Issue.findByIdAndUpdate(
        req.params.id,
        { $pull: { upvotes: userId } },
        { new: true }
      );
    } else {
      updatedIssue = await Issue.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { upvotes: userId } },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: hasUpvoted ? "Upvote removed" : "Issue upvoted 👍",
      upvoteCount: updatedIssue.upvotes.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error while upvoting",
    });
  }
};

// @desc    Update issue status & append to timeline
// @route   PATCH /api/issues/:id/status
// @access  Private (Official / Admin or Logged-in User)
export const updateIssueStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const allowedStatuses = [
      "Reported",
      "Under-Review",
      "In-Progress",
      "Resolved",
      "Escalated",
    ];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Please provide a valid status: ${allowedStatuses.join(", ")}`,
      });
    }
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }
    issue.status = status;
    issue.timeline.push({
      status: status,
      updatedBy: req.user._id,
      comment: comment || `Status updated to ${status}`,
      timestamp: new Date(),
    });
    //  Save Cloudinary After-Photo
    if (req.file && req.file.path) {
      issue.images.after = [req.file.path]; // 🌟 Permanent Cloudinary CDN link!
    } else if (req.body.afterImages) {
      issue.images.after = Array.isArray(req.body.afterImages)
        ? req.body.afterImages
        : [req.body.afterImages];
    }
    await issue.save();
    // Populate for UI
    const populatedIssue = await Issue.findById(issue._id)
      .populate("reportedBy", "name email")
      .populate("upvotes", "name")
      .populate("timeline.updatedBy", "name role");
    res.status(200).json({
      success: true,
      message: `Issue status updated to '${status}' successfully! 🚀`,
      data: populatedIssue,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error while updating status",
    });
  }
};
// @desc    Check if a similar issue exists within 50 meters
// @route   POST /api/issues/check-duplicate
// @access  Public
export const checkDuplicate = async (req, res) => {
  try {
    const { longitude, latitude, category } = req.body;

    if (!longitude || !latitude || !category) {
      return res.status(400).json({
        success: false,
        message: "Please provide longitude, latitude, and category",
      });
    }

    const existingIssues = await Issue.find({
      category: category,
      status: { $in: ["Reported", "Under-Review", "In-Progress"] },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: 50,
        },
      },
    }).populate("reportedBy", "name email");

    if (existingIssues.length > 0) {
      return res.status(200).json({
        success: true,
        isDuplicate: true,
        message: "A similar active issue was already reported nearby!",
        existingIssue: existingIssues[0],
      });
    }

    res.status(200).json({
      success: true,
      isDuplicate: false,
      message: "No duplicate issues found nearby. Good to report! 👍",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error while checking duplicates",
    });
  }
};

// @desc    Get single issue by ID
// @route   GET /api/issues/:id
// @access  Public
export const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate("reportedBy", "name email phone")
      .populate("upvotes", "name")
      .populate("timeline.updatedBy", "name role");

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    res.status(200).json({
      success: true,
      data: issue,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching issue",
    });
  }
};

// @desc    Citizen verifies or rejects a resolved issue
// @route   PATCH /api/issues/:id/verify
// @access  Private (Only the citizen who reported the issue)
export const verifyIssue = async (req, res) => {
  try {
    const { verified, comment, rating } = req.body;

    if (typeof verified !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Please provide verified as true or false",
      });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    if (issue.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the citizen who reported this issue can verify it",
      });
    }

    if (issue.status !== "Resolved") {
      return res.status(400).json({
        success: false,
        message: "Only resolved issues can be verified",
      });
    }

    issue.verification.status = verified ? "Verified" : "Rejected";
    issue.verification.comment = comment || "";
    issue.verification.verifiedAt = new Date();

    if (verified) {
      if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
        issue.verification.rating = Number(rating);
      }
      issue.status = "Closed";
      issue.timeline.push({
        status: "Closed",
        updatedBy: req.user._id,
        comment: comment || `Citizen verified resolution with a rating of ${rating || 5}/5 ⭐.`,
        timestamp: new Date(),
      });
    } else {
      issue.status = "Reopened";
      issue.timeline.push({
        status: "Reopened",
        updatedBy: req.user._id,
        comment: comment || "Citizen reported that the issue is still not resolved.",
        timestamp: new Date(),
      });
    }

    await issue.save();

    res.status(200).json({
      success: true,
      message: verified
        ? "Issue verified and closed successfully! ✅"
        : "Issue reopened successfully! 🔄",
      data: issue,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error while verifying issue",
    });
  }
};

// @desc    AI Smart Auto-Classifier & Department Routing
// @route   POST /api/issues/ai-classify
// @access  Public
export const classifyIssueAI = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title && !description) {
      return res.status(400).json({
        success: false,
        message: "Please provide a title or description for AI classification",
      });
    }

    const text = `${title || ""} ${description || ""}`.toLowerCase();

    // 1. Category & Department Mapping Rules
    const categories = [
      {
        category: "Sanitation & Garbage",
        department: "Solid Waste Management & Sanitation Board",
        keywords: ["garbage", "trash", "waste", "dump", "filth", "smell", "bin", "dustbin", "litter", "rubbish", "debris", "dead animal", "unclean"],
      },
      {
        category: "Roads & Potholes",
        department: "Public Works Department (PWD - Civil Infrastructure)",
        keywords: ["pothole", "road", "pavement", "asphalt", "footpath", "bridge", "divider", "crater", "speed breaker", "highway", "tar", "flyover"],
      },
      {
        category: "Electricity & Lighting",
        department: "State Electricity Transmission & Streetlighting Cell",
        keywords: ["streetlight", "light", "pole", "wire", "spark", "transformer", "power cut", "blackout", "dark", "hanging wire", "shock", "bulb", "fuse"],
      },
      {
        category: "Water Supply & Drainage",
        department: "Municipal Water Supply & Sewerage Board (BWSSB/Jal Board)",
        keywords: ["water", "pipe", "pipeline", "leak", "drain", "drainage", "sewer", "sewage", "gutter", "overflow", "flood", "contaminated", "tap", "drinking water"],
      },
      {
        category: "Public Safety",
        department: "Civil Defense, Fire & Public Safety Department",
        keywords: ["fire", "hazard", "dangerous", "illegal", "encroachment", "collapsed", "collapse", "tree fallen", "threat", "emergency", "open manhole"],
      },
    ];

    let matchedCategory = "Other";
    let matchedDepartment = "General Grievance Redressal Cell";
    let highestScore = 0;

    for (const item of categories) {
      let score = 0;
      for (const kw of item.keywords) {
        if (text.includes(kw)) {
          score += 1;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        matchedCategory = item.category;
        matchedDepartment = item.department;
      }
    }

    // 2. Severity & Priority Assessment
    const criticalKeywords = ["emergency", "fire", "spark", "shock", "flood", "flooding", "collapsed", "open manhole", "hazard", "burst", "threat", "fatal"];
    const highKeywords = ["accident", "blocked", "overflow", "broken", "danger", "massive", "heavy", "urgent", "completely"];

    let priority = "Medium";
    let slaHours = 48;
    let urgencyReason = "Standard civic grievance priority queue.";

    const hasCritical = criticalKeywords.some((kw) => text.includes(kw));
    const hasHigh = highKeywords.some((kw) => text.includes(kw));

    if (hasCritical) {
      priority = "Critical";
      slaHours = 24;
      urgencyReason = "High safety risk detected. Fast-tracked for emergency 24-hour SLA dispatch.";
    } else if (hasHigh || highestScore >= 3) {
      priority = "High";
      slaHours = 36;
      urgencyReason = "Significant civic disruption identified. Escalated to 36-hour SLA window.";
    } else if (highestScore === 0) {
      priority = "Low";
      slaHours = 72;
      urgencyReason = "Non-emergency issue classified for routine inspection.";
    }

    const confidence = highestScore >= 2 ? "95%" : highestScore === 1 ? "82%" : "68%";

    return res.status(200).json({
      success: true,
      data: {
        category: matchedCategory,
        department: matchedDepartment,
        priority,
        slaHours,
        confidence,
        urgencyReason,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error in AI classification engine",
    });
  }
};
// @desc    Delete an issue (Only by the reporter citizen or admin)
// @route   DELETE /api/issues/:id
// @access  Private
export const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    // Security: Only the citizen who reported it (or admin) can delete
    if (
      issue.reportedBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: You can only delete issues reported by you.",
      });
    }

    await Issue.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully! 🗑️",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error while deleting issue",
    });
  }
};