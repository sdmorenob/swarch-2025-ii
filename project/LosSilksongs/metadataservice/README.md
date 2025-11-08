# Metadata Service

Metadata Service is a gRPC microservice that enriches music track metadata using the Spotify API. It provides intelligent matching and confidence scoring for accurate metadata enrichment.

## Features

- 🎵 **Spotify Integration**: Automatic metadata enrichment from Spotify
- 🎯 **Intelligent Matching**: Fuzzy matching with confidence scoring
- 💾 **Flexible Caching**: Redis or in-memory cache support
- 🚀 **Batch Processing**: Handle multiple tracks efficiently
- 🔄 **Retry Logic**: Automatic retry with exponential backoff
- 📊 **Rate Limiting**: Respect Spotify API limits
- 🐳 **Docker Ready**: Full containerization support

## Quick Start

### Prerequisites

- Python 3.11+
- Spotify Developer Account ([Get credentials](https://developer.spotify.com/dashboard))
- Docker (optional)

### Local Development

1. **Clone and setup**:
```bash
git clone <repository-url>
cd metadataservice
make setup
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env and add your Spotify credentials
```

3. **Run the service**:
```bash
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

make run
```

The service will start on `localhost:50051`

### Docker

```bash
# Using docker-compose
docker-compose up -d

# Or build and run manually
make docker-build
make docker-run
```

## Configuration

### Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy `Client ID` and `Client Secret`
4. Add them to `.env`:
```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GRPC_PORT` | 50051 | gRPC server port |
| `SPOTIFY_CLIENT_ID` | - | Spotify API client ID (required) |
| `SPOTIFY_CLIENT_SECRET` | - | Spotify API client secret (required) |
| `REDIS_URL` | - | Redis connection URL (optional) |
| `CACHE_ENABLED` | true | Enable/disable caching |
| `CACHE_TTL` | 3600 | Cache time-to-live in seconds |
| `FUZZY_MATCHING_THRESHOLD` | 0.8 | Match confidence threshold (0.0-1.0) |
| `SPOTIFY_REQUESTS_PER_SECOND` | 10 | Rate limit for Spotify API |
| `LOG_LEVEL` | INFO | Logging level |

See `.env.example` for complete configuration options.

## API Reference

### gRPC Methods

#### EnrichTrack

Enrich a single track with Spotify metadata.

**Request:**
```protobuf
message EnrichTrackRequest {
  string title = 1;
  string artist = 2;
  string album = 3;        // optional
  int32 duration = 4;      // optional
  string genre_hint = 5;   // optional
}
```

**Response:**
```protobuf
message EnrichTrackResponse {
  bool success = 1;
  SpotifyMetadata metadata = 2;
  string error_message = 3;
  float confidence = 4;
}
```

#### BatchEnrichTracks

Process multiple tracks in a single request.

**Request:**
```protobuf
message BatchEnrichRequest {
  repeated EnrichTrackRequest tracks = 1;
}
```

**Response:**
```protobuf
message BatchEnrichResponse {
  repeated EnrichTrackResponse results = 1;
}
```

#### SearchTracks

Search for tracks in Spotify.

**Request:**
```protobuf
message SearchRequest {
  string query = 1;
  int32 limit = 2;
  int32 offset = 3;
}
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Metadata Service                │
│                                         │
│  ┌──────────┐      ┌──────────────┐   │
│  │  gRPC    │─────▶│   Metadata   │   │
│  │  Server  │      │   Service    │   │
│  └──────────┘      └──────┬───────┘   │
│                            │            │
│              ┌─────────────┴────────┐  │
│              │                      │  │
│      ┌───────▼────────┐    ┌───────▼──────┐
│      │ Spotify Client │    │Cache Service │
│      └───────┬────────┘    └──────────────┘
│              │                              │
└──────────────┼──────────────────────────────┘
               │
        ┌──────▼──────┐
        │ Spotify API │
        └─────────────┘
```

## Matching Algorithm

The service uses intelligent fuzzy matching to ensure accurate metadata enrichment:

1. **String Normalization**: Removes accents, special characters, and common variations
2. **Weighted Scoring**:
   - Title: 50%
   - Artist: 40%
   - Album: 10%
3. **Confidence Threshold**: Only returns matches above configured threshold (default: 0.8)
4. **Fallback Search**: Tries exact match first, then flexible search

Example:
```
Original:  "Bohemian Rhapsody" by "Queen"
Spotify:   "Bohemian Rhapsody - Remastered" by "Queen"
Confidence: 0.95 ✅ (Match accepted)

Original:  "Let It Be" by "Beatles"
Spotify:   "Let It Be" by "Paul McCartney"
Confidence: 0.72 ❌ (Match rejected)
```

## Integration with Music Service

Update your Music Service's gRPC client to connect to this service:

```go
// In musicservice/internal/handlers/grpc/metadata_client.go
func NewMetadataClient(address string) (MetadataClient, error) {
    opts := []grpc.DialOption{
        grpc.WithTransportCredentials(insecure.NewCredentials()),
        grpc.WithKeepaliveParams(keepalive.ClientParameters{
            Time:                10 * time.Second,
            Timeout:             time.Second,
            PermitWithoutStream: true,
        }),
    }
    
    conn, err := grpc.Dial(address, opts...)
    if err != nil {
        return nil, err
    }
    
    client := pb.NewMetadataServiceClient(conn)
    return &metadataClient{client: client, conn: conn}, nil
}
```

## Development

### Generate Protobuf Files

```bash
make proto
```

### Run Tests

```bash
make test

# With coverage
make test-cov
```

### Code Formatting

```bash
# Format code
make format

# Check formatting
make format-check
```

### Linting

```bash
make lint
```

## Caching

### In-Memory Cache (Default - Actual)

**El servicio usa cache en memoria por defecto.** No necesitas configurar nada adicional.

**Pros:** 
- ✅ Simple, sin dependencias
- ✅ Rápido
- ✅ No requiere servicios adicionales

**Cons:** 
- ⚠️ Se pierde al reiniciar
- ⚠️ No compartido entre instancias
- ⚠️ Limitado por RAM

### Redis Cache (Opcional - No implementado actualmente)

**Para habilitar Redis en el futuro:**

1. **Descomentar en docker-compose.yml:**
```yaml
redis:
  image: redis:7-alpine
  ...
```

2. **Configurar en `.env`**:
```env
REDIS_URL=redis://localhost:6379/0
CACHE_ENABLED=true
```

3. **Instalar dependencias:**
```bash
pip install redis hiredis
```

**Pros:** 
- ✅ Persistente
- ✅ Compartido entre instancias
- ✅ Mayor capacidad

**Cons:** 
- ⚠️ Requiere servicio Redis
- ⚠️ Mayor complejidad

## Troubleshooting

### "Spotify credentials not configured"

Make sure you've set `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` in `.env`

### "Rate limit exceeded"

Reduce `SPOTIFY_REQUESTS_PER_SECOND` in configuration or implement request queuing.

### "No match found" for valid tracks

- Lower `FUZZY_MATCHING_THRESHOLD` (try 0.7)
- Check spelling in track metadata
- Some tracks may not be available in Spotify

### Redis connection errors

If using Redis cache:
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli ping
```

## Performance

### Benchmarks

- **Single Track Enrichment**: ~200-500ms (with Spotify API call)
- **Single Track (Cached)**: <5ms
- **Batch Processing (10 tracks)**: ~2-3s
- **Rate Limit**: Configurable, default 10 req/s

### Optimization Tips

1. Enable Redis caching for production
2. Increase cache TTL for stable metadata
3. Use batch processing for multiple tracks
4. Adjust rate limits based on your Spotify API quota

## Monitoring

### Health Check

```bash
# Using grpcurl
grpcurl -plaintext localhost:50051 health

# Using Python
python -c "import grpc; channel = grpc.insecure_channel('localhost:50051'); print('Healthy' if channel.channel_ready() else 'Unhealthy')"
```

### Logs

Logs include:
- Request/response details
- Match confidence scores
- Cache hit/miss rates
- Spotify API errors
- Rate limiting events

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or contributions, please contact the development team.