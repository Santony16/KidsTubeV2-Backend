# KidsTube - Backend

KidsTube is a web application designed to provide a safe and controlled YouTube viewing experience for children. This repository contains the backend REST API service of the application.

## About KidsTube

KidsTube addresses the growing concern of parents regarding their children's online video consumption. As digital natives, today's children spend significant time watching online videos, but standard platforms offer limited tools for parents to effectively curate this experience.

## Dual-API Architecture

KidsTube implements a dual-API architecture:

1. **REST API** (this repository): Handles traditional CRUD operations, authentication, and data persistence
2. **GraphQL API** (separate repository): Provides flexible querying with field selection, complex nested queries, and advanced filtering

This combined approach leverages the strengths of both API paradigms for maximum flexibility.

### The Problem KidsTube Solves

Current video platforms present several challenges:
- Children can easily access inappropriate content
- Recommendation algorithms don't always respect age-appropriateness
- Limited granular control for parents over what specific videos children can watch
- Difficulty in creating safe, personalized content collections for different children in the same household

### Our Solution

KidsTube's backend powers a comprehensive solution that:
- Maintains secure user authentication with separate parent and child accounts
- Stores encrypted PIN codes for access control
- Manages a database of parent-approved videos
- Enables the creation and assignment of custom playlists to specific child profiles
- Provides API endpoints that enforce the parent-defined boundaries
- Ensures children can only access content approved for them

This approach transforms how families interact with online video content, giving parents precise control while allowing children age-appropriate independence.

## Architecture

The backend follows a RESTful API design with:
- Clear separation between authentication, data management, and business logic
- MongoDB collections that maintain relationships between users, profiles, videos, and playlists
- Secure password and PIN storage using bcrypt hashing
- Stateless authentication model with JWT tokens
- Integration with GraphQL API for advanced query capabilities

## Overview

The backend provides the API endpoints that power the KidsTube application, including user authentication, video management, playlist management, and restricted user access control.

## Features

- User authentication and session management
- Secure password and PIN hashing
- CRUD operations for videos
- Playlist management and video assignments
- Restricted user profile management
- PIN verification for both admin and restricted users
- Country data retrieval for registration
- JWT token generation for both REST and GraphQL authentication

## Tech Stack

- Node.js with Express
- MongoDB for database
- Mongoose for object modeling
- bcryptjs for password/PIN hashing
- CORS support for cross-origin requests

## Setup Instructions

### Prerequisites
- Node.js (v11.12.0 recommended, use nvm for version management)
- MongoDB instance (local or Atlas)

### Installation

1. Clone this repository:
   ```
   git clone [backend-repository-url]
   cd KidsTube-Backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure MongoDB connection:
   - Open `index.js`
   - Update the MongoDB connection string if necessary

4. Start the server:
   ```
   npm start
   ```
   The backend will run on port 3001 by default.

## API Endpoints

### User Management
- `POST /api/users/register` - Register a new parent/admin user
- `POST /api/users/login` - Authenticate a user
- `POST /api/users/verify-pin` - Verify admin PIN

### Restricted User Management
- `GET /api/users/restricted` - Get all restricted users for parent
- `GET /api/users/restricted/:userId` - Get specific restricted user
- `POST /api/users/restricted` - Create a new restricted user
- `PUT /api/users/restricted/:userId` - Update a restricted user
- `DELETE /api/users/restricted/:userId` - Delete a restricted user
- `POST /api/users/restricted/verify-pin` - Verify restricted user PIN

### Video Management
- `GET /api/videos` - Get all videos
- `POST /api/videos/create` - Add a new video
- `PUT /api/videos/:videoId` - Update a video
- `DELETE /api/videos/:videoId` - Delete a video

### Playlist Management
- `GET /api/playlists` - Get all playlists
- `POST /api/playlists/create` - Create a new playlist
- `GET /api/playlists/:playlistId` - Get a specific playlist
- `PUT /api/playlists/:playlistId` - Update a playlist
- `DELETE /api/playlists/:playlistId` - Delete a playlist
- `GET /api/playlists/user/:userId` - Get playlists for a restricted user
- `POST /api/playlists/:playlistId/videos` - Add video to playlist
- `DELETE /api/playlists/:playlistId/videos/:videoId` - Remove video from playlist
- `GET /api/playlists/:playlistId/videos` - Get videos in a playlist

### Utilities
- `GET /api/countries` - Get list of countries for registration

## Database Models

- **User**: Parent/admin accounts
- **RestrictedUser**: Child profiles with PIN protection
- **Video**: YouTube video metadata
- **Playlist**: Collections of videos assigned to restricted users

## Security Features

- Password hashing for admin accounts
- PIN encryption for all users
- Input validation and sanitization
- Error handling and logging

## Integration with GraphQL

This REST API serves as the primary data source for the GraphQL API. While most CRUD operations and authentication flows are handled directly by this API, the GraphQL API provides enhanced querying capabilities for frontend clients.

Some benefits of this integration:
- Single source of truth for business logic and data persistence
- Unified authentication system using shared JWT tokens
- Ability to choose the most appropriate API paradigm based on the specific need

For complex data fetching operations, consider using the GraphQL API. For straightforward CRUD operations and authentication, this REST API provides simple, direct endpoints.

## License

This project is for educational purposes.
