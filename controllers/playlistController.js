const Playlist = require("../models/Playlist");
const Video = require("../models/Video");
const RestrictedUser = require("../models/RestrictedUser");
const User = require("../models/User");

// Creat new playlist
const createPlaylist = async (req, res) => {
    try {
        const { name, profiles, userId } = req.body;

        // Verify if the playlist already exists
        const existingPlaylist = await Playlist.findOne({ name });
        if (existingPlaylist) {
            return res.status(400).json({ error: "Playlist already exists." });
        }

        // Use the parent user ID if provided, otherwise use the first user found
        let parentUser;
        if (userId) {
            parentUser = await User.findById(userId);
        } else {
            // Fallback for compatibility
            parentUser = await User.findOne();
        }
        
        if (!parentUser) {
            return res.status(404).json({ error: "Parent user not found" });
        }

        // Create a new playlist
        const newPlaylist = new Playlist({ 
            name, 
            profiles, 
            videos: [],
            parentUser: parentUser._id
        });

        await newPlaylist.save();

        res.status(201).json({ 
            message: "Playlist added successfully",
            playlistId: newPlaylist._id
        });

    } catch (error) {
        console.error("Error adding playlist:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// get all playlists
const getPlaylists = async (req, res) => {
    try {
        // Get the userId from query parameter
        const { userId } = req.query;
        
        // Create a filter based on userId - only return playlists for this specific user
        const filter = userId ? { parentUser: userId } : {};
        
        // Find playlists that match the filter
        const playlists = await Playlist.find(filter)
            .populate("profiles", "name")
            .populate("videos", "name url description");
            
        res.status(200).json(playlists);
    } catch (error) {
        console.error("Error fetching playlists:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// get playlist by id
const getPlaylistById = async (req, res) => {
    try {
        const { playlistId } = req.params;
        const playlist = await Playlist.findById(playlistId)
            .populate("profiles", "name")
            .populate("videos", "name url description");
            
        if (!playlist) {
            return res.status(404).json({ error: "Playlist not found" });
        }
        
        res.status(200).json(playlist);
    } catch (error) {
        console.error("Error fetching playlist:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// get playlists by user
const getPlaylistsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const playlists = await Playlist.find({ profiles: userId })
            .populate("videos", "name url description");
            
        res.status(200).json(playlists);
    } catch (error) {
        console.error("Error fetching user playlists:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// add video to playlist
const addVideoToPlaylist = async (req, res) => {
    try {
        const { playlistId } = req.params;
        const { videoId } = req.body;
        
        if (!videoId) {
            return res.status(400).json({ error: "Video ID is required" });
        }
        
        // Verify if the playlist exists
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({ error: "Playlist not found" });
        }
        
        // Verify if the video exists
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ error: "Video not found" });
        }
        
        // Verify if the video is already in the playlist
        if (playlist.videos.includes(videoId)) {
            return res.status(400).json({ error: "Video already in playlist" });
        }
        
        // add video to playlist
        playlist.videos.push(videoId);
        await playlist.save();
        
        // Fetch the updated playlist with populated videos
        const updatedPlaylist = await Playlist.findById(playlistId).populate("videos");
        
        // Return the updated playlist videos in the response
        res.status(200).json({ 
            message: "Video added to playlist successfully",
            videos: updatedPlaylist.videos
        });
    } catch (error) {
        console.error("Error adding video to playlist:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// drop video from playlist
const removeVideoFromPlaylist = async (req, res) => {
    try {
        const { playlistId, videoId } = req.params;
        
        // Verify if the playlist exists
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({ error: "Playlist not found" });
        }
        
        // drop video from playlist
        playlist.videos = playlist.videos.filter(id => id.toString() !== videoId);
        await playlist.save();
        
        res.status(200).json({ message: "Video removed from playlist successfully" });
    } catch (error) {
        console.error("Error removing video from playlist:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// get playlist videos
const getPlaylistVideos = async (req, res) => {
    try {
        const { playlistId } = req.params;

        await new Promise(resolve => setTimeout(resolve, 100));
        
        const playlist = await Playlist.findById(playlistId).populate("videos");
        
        if (!playlist) {
            return res.status(404).json({ error: "Playlist not found" });
        }
        
        // Add cache control headers to prevent browser caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        res.status(200).json(playlist.videos);
    } catch (error) {
        console.error("Error fetching playlist videos:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// drop playlist
const deletePlaylist = async (req, res) => {
    try {
        const { playlistId } = req.params;
        
        const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
        
        if (!deletedPlaylist) {
            return res.status(404).json({ error: "Playlist not found" });
        }
        
        res.status(200).json({ message: "Playlist deleted successfully" });
    } catch (error) {
        console.error("Error deleting playlist:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// update playlist
const updatePlaylist = async (req, res) => {
    try {
        const { playlistId } = req.params;
        const { name, profiles } = req.body;
        
        if (!name || !profiles || profiles.length === 0) {
            return res.status(400).json({ error: "Name and profiles are required" });
        }
        
        // Verifiy if the playlist exists
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({ error: "Playlist not found" });
        }
        
        // update playlist
        playlist.name = name;
        playlist.profiles = profiles;
        
        await playlist.save();
        
        res.status(200).json({ 
            message: "Playlist updated successfully",
            playlist: {
                _id: playlist._id,
                name: playlist.name,
                profiles: playlist.profiles
            }
        });
    } catch (error) {
        console.error("Error updating playlist:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    createPlaylist,
    getPlaylists,
    getPlaylistById,
    getPlaylistsByUser,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistVideos,
    deletePlaylist,
    updatePlaylist
};
