# Music Service - API Documentation

Music Service is a RESTful microservice for managing audio files and playlists. It handles file uploads, metadata extraction, storage management, and playlist operations.

## Table of Contents

- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
  - [Health Check](#health-check)
  - [Tracks](#tracks)
  - [Playlists](#playlists)
- [Request/Response Examples](#requestresponse-examples)
- [Error Handling](#error-handling)
- [Development](#development)

---

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Port 8081 available for the Music Service
- Port 27017 available for MongoDB

### Running with Docker Compose

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Start the services**
   ```bash
   docker-compose up -d
   ```

3. **Verify the service is running**
   ```bash
   curl http://localhost:8081/health
   ```

   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "music-service",
     "timestamp": "2024-01-15T10:30:00Z"
   }
   ```

4. **Stop the services**
   ```bash
   docker-compose down
   ```

### Service URLs

- **Music Service API**: `http://localhost:8081`
- **MongoDB**: `localhost:27017` (username: `admin`, password: `password123`)

---

## API Endpoints

### Base URL

```
http://localhost:8081/api/v1
```

### Response Format

All endpoints return JSON responses with the following structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error description"
}
```

---

## Health Check

### Check Service Health

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "music-service",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Tracks

### Upload Track

Upload an audio file to the service.

```http
POST /api/v1/tracks/upload
```

**Content-Type:** `multipart/form-data`

**Form Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | Audio file (MP3, WAV, FLAC, M4A, OGG, AAC) |
| `user_id` | String | Yes | User identifier |
| `tags` | String | No | Comma-separated tags (e.g., "rock,classic") |
| `is_public` | Boolean | No | Whether the track is public (default: false) |

**Example using curl:**
```bash
curl -X POST http://localhost:8081/api/v1/tracks/upload \
  -F "file=@/path/to/song.mp3" \
  -F "user_id=user123" \
  -F "tags=rock,classic" \
  -F "is_public=true"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "user_id": "user123",
    "filename": "song.mp3",
    "file_path": "/app/uploads/audio/track_507f1f77bcf86cd799439011.mp3",
    "file_size": 3458976,
    "mime_type": "audio/mpeg",
    "file_url": "/uploads/audio/track_507f1f77bcf86cd799439011.mp3",
    "original_metadata": {
      "title": "Bohemian Rhapsody",
      "artist": "Queen",
      "album": "A Night at the Opera",
      "genre": "Rock",
      "year": 1975,
      "track": 1,
      "duration": 354,
      "bitrate": 320,
      "sample_rate": 44100
    },
    "tags": ["rock", "classic"],
    "is_public": true,
    "upload_status": "processing",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Track uploaded successfully"
}
```

### Get Track Details

Retrieve information about a specific track.

```http
GET /api/v1/tracks/:id
```

**Example:**
```bash
curl http://localhost:8081/api/v1/tracks/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "user_id": "user123",
    "filename": "song.mp3",
    "original_metadata": { ... },
    "tags": ["rock", "classic"],
    "is_public": true,
    "upload_status": "completed",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Track retrieved successfully"
}
```

### List Tracks

List tracks with optional filtering and pagination.

```http
GET /api/v1/tracks
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Integer | 1 | Page number |
| `limit` | Integer | 20 | Items per page (max: 100) |
| `user_id` | String | - | Filter by user ID |
| `genre` | String | - | Filter by genre |
| `artist` | String | - | Filter by artist name |
| `is_public` | Boolean | - | Filter by public/private |
| `search` | String | - | Search in title, artist, album, or tags |

**Example:**
```bash
curl "http://localhost:8081/api/v1/tracks?page=1&limit=10&genre=rock&is_public=true"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tracks": [
      {
        "id": "507f1f77bcf86cd799439011",
        "user_id": "user123",
        "filename": "song.mp3",
        "original_metadata": { ... },
        "is_public": true
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 10,
      "total_pages": 5,
      "total_items": 45,
      "has_next": true,
      "has_prev": false
    }
  },
  "message": "Tracks retrieved successfully"
}
```

### Stream Track

Stream audio file for playback.

```http
GET /api/v1/tracks/:id/stream
```

**Example:**
```bash
curl http://localhost:8081/api/v1/tracks/507f1f77bcf86cd799439011/stream
```

This endpoint redirects to the file URL. Use in audio players or `<audio>` tags:

```html
<audio controls>
  <source src="http://localhost:8081/api/v1/tracks/507f1f77bcf86cd799439011/stream" type="audio/mpeg">
</audio>
```

### Delete Track

Delete a track (only the owner can delete).

```http
DELETE /api/v1/tracks/:id?user_id=USER_ID
```

**Query Parameters:**
- `user_id` (required): User ID for authorization

**Example:**
```bash
curl -X DELETE "http://localhost:8081/api/v1/tracks/507f1f77bcf86cd799439011?user_id=user123"
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Track deleted successfully"
}
```

---

## Playlists

### Create Playlist

Create a new playlist.

```http
POST /api/v1/playlists
```

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "creator_id": "user123",
  "name": "My Favorite Rock Songs",
  "description": "A collection of classic rock hits",
  "is_public": true,
  "is_collaborative": false
}
```

**Example:**
```bash
curl -X POST http://localhost:8081/api/v1/playlists \
  -H "Content-Type: application/json" \
  -d '{
    "creator_id": "user123",
    "name": "My Rock Collection",
    "description": "Best rock songs",
    "is_public": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "creator_id": "user123",
    "name": "My Favorite Rock Songs",
    "description": "A collection of classic rock hits",
    "track_ids": [],
    "is_public": true,
    "is_collaborative": false,
    "track_count": 0,
    "total_duration": 0,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Playlist created successfully"
}
```

### Get Playlist Details

Retrieve playlist information.

```http
GET /api/v1/playlists/:id
```

**Query Parameters:**
- `include_tracks` (optional): Set to "true" to include full track information

**Example (without tracks):**
```bash
curl http://localhost:8081/api/v1/playlists/507f1f77bcf86cd799439012
```

**Example (with tracks):**
```bash
curl "http://localhost:8081/api/v1/playlists/507f1f77bcf86cd799439012?include_tracks=true"
```

**Response (with tracks):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "creator_id": "user123",
    "name": "My Rock Collection",
    "track_count": 2,
    "tracks": [
      {
        "id": "507f1f77bcf86cd799439011",
        "filename": "song1.mp3",
        "original_metadata": { ... }
      },
      {
        "id": "507f1f77bcf86cd799439013",
        "filename": "song2.mp3",
        "original_metadata": { ... }
      }
    ]
  },
  "message": "Playlist with tracks retrieved successfully"
}
```

### List Playlists

List playlists with filtering and pagination.

```http
GET /api/v1/playlists
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Integer | 1 | Page number |
| `limit` | Integer | 20 | Items per page (max: 100) |
| `creator_id` | String | - | Filter by creator ID |
| `is_public` | Boolean | - | Filter by public/private |
| `search` | String | - | Search in name or description |

**Example:**
```bash
curl "http://localhost:8081/api/v1/playlists?page=1&limit=10&is_public=true"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "playlists": [
      {
        "id": "507f1f77bcf86cd799439012",
        "creator_id": "user123",
        "name": "My Rock Collection",
        "track_count": 5,
        "is_public": true
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 10,
      "total_pages": 3,
      "total_items": 25,
      "has_next": true,
      "has_prev": false
    }
  },
  "message": "Playlists retrieved successfully"
}
```

### Update Playlist

Update playlist information (only creator or collaborators can update).

```http
PUT /api/v1/playlists/:id?user_id=USER_ID
```

**Content-Type:** `application/json`

**Query Parameters:**
- `user_id` (required): User ID for authorization

**Request Body (all fields optional):**
```json
{
  "name": "Updated Playlist Name",
  "description": "Updated description",
  "is_public": false,
  "is_collaborative": true
}
```

**Example:**
```bash
curl -X PUT "http://localhost:8081/api/v1/playlists/507f1f77bcf86cd799439012?user_id=user123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Updated Rock Collection",
    "is_public": false
  }'
```

### Delete Playlist

Delete a playlist (only creator can delete).

```http
DELETE /api/v1/playlists/:id?user_id=USER_ID
```

**Query Parameters:**
- `user_id` (required): User ID for authorization

**Example:**
```bash
curl -X DELETE "http://localhost:8081/api/v1/playlists/507f1f77bcf86cd799439012?user_id=user123"
```

### Add Track to Playlist

Add a track to a playlist.

```http
POST /api/v1/playlists/:id/tracks?user_id=USER_ID
```

**Content-Type:** `application/json`

**Query Parameters:**
- `user_id` (required): User ID for authorization

**Request Body:**
```json
{
  "track_id": "507f1f77bcf86cd799439011"
}
```

**Example:**
```bash
curl -X POST "http://localhost:8081/api/v1/playlists/507f1f77bcf86cd799439012/tracks?user_id=user123" \
  -H "Content-Type: application/json" \
  -d '{
    "track_id": "507f1f77bcf86cd799439011"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "name": "My Rock Collection",
    "track_count": 3,
    "track_ids": ["507f1f77bcf86cd799439011", ...]
  },
  "message": "Track added to playlist successfully"
}
```

### Remove Track from Playlist

Remove a track from a playlist.

```http
DELETE /api/v1/playlists/:id/tracks/:trackId?user_id=USER_ID
```

**Query Parameters:**
- `user_id` (required): User ID for authorization

**Example:**
```bash
curl -X DELETE "http://localhost:8081/api/v1/playlists/507f1f77bcf86cd799439012/tracks/507f1f77bcf86cd799439011?user_id=user123"
```

### Get User Playlists

Get all playlists created by a specific user.

```http
GET /api/v1/users/:userId/playlists
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Example:**
```bash
curl "http://localhost:8081/api/v1/users/user123/playlists?page=1&limit=10"
```

---

## Error Handling

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Duplicate resource |
| 413 | Payload Too Large - File exceeds size limit |
| 415 | Unsupported Media Type |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Common Error Responses

**Invalid File Type:**
```json
{
  "success": false,
  "error": "unsupported file type. Supported formats: MP3, WAV, FLAC, M4A, OGG, AAC"
}
```

**File Too Large:**
```json
{
  "success": false,
  "error": "file size exceeds maximum allowed size of 50.0 MB"
}
```

**Resource Not Found:**
```json
{
  "success": false,
  "error": "Track not found"
}
```

**Unauthorized Access:**
```json
{
  "success": false,
  "error": "unauthorized: you can only delete your own tracks"
}
```

---

## Development

### Supported Audio Formats

- MP3 (.mp3)
- WAV (.wav)
- FLAC (.flac)
- M4A/AAC (.m4a, .aac)
- OGG (.ogg)
- WMA (.wma)

### File Size Limits

- **Maximum file size**: 50 MB per upload
- **Minimum file size**: 1 KB

### Storage

Uploaded files are stored in the `/app/uploads` directory inside the container, which is mapped to `./uploads` in your project directory.

**Directory structure:**
```
uploads/
├── audio/       # Audio files
├── temp/        # Temporary files
└── covers/      # Playlist covers (future)
```

### Metadata Extraction

The service automatically extracts ID3 metadata from uploaded audio files, including:
- Title
- Artist
- Album
- Genre
- Year
- Track number
- Duration
- Bitrate
- Sample rate

### Notes for Frontend Integration

1. **Authentication**: Currently, `user_id` is passed as a query parameter or form field. In production, implement proper JWT authentication.

2. **File Uploads**: Use `FormData` for track uploads:
   ```javascript
   const formData = new FormData();
   formData.append('file', audioFile);
   formData.append('user_id', 'user123');
   formData.append('tags', 'rock,classic');
   formData.append('is_public', 'true');

   const response = await fetch('http://localhost:8081/api/v1/tracks/upload', {
     method: 'POST',
     body: formData
   });
   ```

3. **Audio Streaming**: Use the stream endpoint directly in HTML5 audio players or fetch for custom players.

4. **CORS**: CORS is enabled for all origins in development. Configure appropriately for production.

5. **Pagination**: Always check the `pagination` object in list responses to implement proper pagination controls.

### Troubleshooting

**Service not starting:**
```bash
# Check logs
docker-compose logs music-service

# Restart services
docker-compose restart
```

**MongoDB connection issues:**
```bash
# Check MongoDB health
docker-compose ps

# Connect to MongoDB
docker exec -it musicshare-mongodb mongosh -u admin -p password123
```

**Upload directory permissions:**
```bash
# Ensure upload directory exists and has correct permissions
mkdir -p uploads/audio uploads/temp uploads/covers
chmod -R 755 uploads
```

---

## API Documentation (Swagger)

The Music Service includes interactive API documentation powered by Swagger/OpenAPI.

### Accessing Swagger UI

Once the service is running, access the interactive API documentation at:

```
http://localhost:8081/swagger/index.html
```

### Features

- **Interactive API Testing**: Test endpoints directly from your browser
- **Request/Response Examples**: See real examples for each endpoint
- **Schema Definitions**: Detailed models and data structures
- **Try It Out**: Execute API calls with custom parameters

### Generating Documentation

The Swagger documentation is automatically generated from code annotations.

**Manual generation:**
```bash
# Install swag CLI tool
go install github.com/swaggo/swag/cmd/swag@latest

# Generate docs
make swagger-gen

# Or use the script directly
bash scripts/generate-swagger.sh
```

**During development:**
```bash
# Generate docs and run server
make serve
```

### Swagger Files

Generated documentation files are located in the `docs/` directory:
- `docs/docs.go` - Go code for embedding
- `docs/swagger.json` - OpenAPI JSON specification
- `docs/swagger.yaml` - OpenAPI YAML specification

### Using Swagger with Docker

When running with Docker Compose, Swagger is automatically available:

```bash
docker-compose up -d
```

Then visit: `http://localhost:8081/swagger/index.html`

### Exporting API Specification

You can export the OpenAPI specification for use with other tools:

**JSON format:**
```bash
curl http://localhost:8081/swagger/doc.json > api-spec.json
```

**YAML format:**
```bash
# Available at: ./docs/swagger.yaml after generation
```

### Integration with API Clients

The generated OpenAPI specification can be imported into:
- **Postman**: Import `docs/swagger.json`
- **Insomnia**: Import OpenAPI 3.0 specification
- **API Gateway**: AWS API Gateway, Kong, etc.
- **Code Generators**: Generate client libraries with `openapi-generator`

### Example: Generate TypeScript Client

```bash
# Install openapi-generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:8081/swagger/doc.json \
  -g typescript-axios \
  -o ./generated-client
```

## Support

For issues, feature requests, or questions, please contact the development team or create an issue in the project repository.