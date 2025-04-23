const express = require("express");
const router = express.Router();
const { getVideos, createVideo, updateVideo, deleteVideo } = require("../controllers/videoController");

router.get("/", getVideos); // Get to show the videos on the table
router.post("/create", createVideo); // Post to create a new video
router.put("/:videoId", updateVideo);   // Put to update video through id
router.delete("/:videoId", deleteVideo);    // Delete method, this get the id video and delete it

module.exports = router;
