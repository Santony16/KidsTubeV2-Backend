const express = require("express");
const router = express.Router();
const {
  createPlaylist,
  getPlaylists,
  getPlaylistById,
  getPlaylistsByUser,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getPlaylistVideos,
  deletePlaylist,
  updatePlaylist
} = require("../controllers/playlistController");

// Routes for the playlists
router.post("/create", createPlaylist);
router.get("/", getPlaylists);
router.get("/:playlistId", getPlaylistById);
router.get("/user/:userId", getPlaylistsByUser);
router.post("/:playlistId/videos", addVideoToPlaylist);
router.delete("/:playlistId/videos/:videoId", removeVideoFromPlaylist);
router.get("/:playlistId/videos", getPlaylistVideos);
router.delete("/:playlistId", deletePlaylist);
router.put("/:playlistId", updatePlaylist);

module.exports = router;
