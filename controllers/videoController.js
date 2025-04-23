const Video = require("../models/Video");

const createVideo = async (req, res) => {
  try {
    const { name, url, description, userId } = req.body;

    // Verify if video already exist with url
    const existvideo = await Video.findOne({ url, userId });

    if (existvideo) {
      return res.status(400).json({ error: "Video already exists." });
    }

    // Create a new video with the userId
    const newVideo = new Video({ name, url, description, userId });
    await newVideo.save();

    res.status(201).json({ message: "Video added successfully", videoId: newVideo._id });

  } catch (error) {
    console.error("Error adding video:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { name, url, description } = req.body;

    const existvideo = await Video.findOne({ url });

    // Verify if the video already exist with the same url
    if (existvideo && existvideo._id.toString() !== videoId) {
      return res.status(400).json({ error: "Another video already has this URL." });
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, { name, url, description }, { new: true });

    if (!updatedVideo) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.status(200).json({ message: "Video updated successfully", video: updatedVideo });
  } catch (error) {
    console.error("Error updating video:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Function to get list of videos
const getVideos = async (req, res) => {
  try {
    const { userId } = req.query;
    
    // If userId is provided, filter videos by user
    const filter = userId ? { userId } : {};
    
    const videos = await Video.find(filter);
    res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete select video
const deleteVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { createVideo, getVideos, updateVideo, deleteVideo };
