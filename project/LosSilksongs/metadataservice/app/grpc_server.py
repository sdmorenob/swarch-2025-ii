import grpc
from concurrent import futures
import logging
import signal
import sys
from typing import Optional

from proto import metadata_pb2, metadata_pb2_grpc
from services.metadata_service import MetadataService
from config import settings

logger = logging.getLogger(__name__)


class MetadataServicer(metadata_pb2_grpc.MetadataServiceServicer):
    """gRPC servicer implementation for MetadataService."""
    
    def __init__(self):
        """Initialize servicer with metadata service."""
        self.metadata_service = MetadataService()
        logger.info("MetadataServicer initialized")

    async def EnrichTrack(
        self, 
        request: metadata_pb2.EnrichTrackRequest, 
        context: grpc.aio.ServicerContext
    ) -> metadata_pb2.EnrichTrackResponse:
        """
        Enrich a single track with metadata from Spotify.
        
        Args:
            request: EnrichTrackRequest protobuf message
            context: gRPC context
            
        Returns:
            EnrichTrackResponse protobuf message
        """
        try:
            logger.info(
                f"Received EnrichTrack request: {request.title} - {request.artist}"
            )
            
            # Call metadata service
            result = await self.metadata_service.enrich_track_metadata(
                title=request.title,
                artist=request.artist,
                album=request.album if request.album else None,
                duration=request.duration if request.duration else None,
                genre_hint=request.genre_hint if request.genre_hint else None
            )

            if result:
                # Convert to protobuf
                spotify_metadata = self._dict_to_spotify_metadata(result)

                return metadata_pb2.EnrichTrackResponse(
                    success=True,
                    metadata=spotify_metadata,
                    confidence=result.get('confidence', 0.0)
                )
            else:
                return metadata_pb2.EnrichTrackResponse(
                    success=False,
                    error_message="No suitable match found in Spotify",
                    confidence=0.0
                )

        except Exception as e:
            logger.error(f"Error in EnrichTrack: {e}", exc_info=True)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return metadata_pb2.EnrichTrackResponse(
                success=False,
                error_message=f"Internal error: {str(e)}",
                confidence=0.0
            )

    async def BatchEnrichTracks(
        self,
        request: metadata_pb2.BatchEnrichRequest,
        context: grpc.aio.ServicerContext
    ) -> metadata_pb2.BatchEnrichResponse:
        """
        Process multiple tracks in batch.
        
        Args:
            request: BatchEnrichRequest protobuf message
            context: gRPC context
            
        Returns:
            BatchEnrichResponse protobuf message
        """
        try:
            logger.info(f"Received BatchEnrichTracks request with {len(request.tracks)} tracks")
            
            # Convert protobuf requests to dicts
            tracks_data = []
            for track_req in request.tracks:
                tracks_data.append({
                    'title': track_req.title,
                    'artist': track_req.artist,
                    'album': track_req.album if track_req.album else None,
                    'duration': track_req.duration if track_req.duration else None,
                    'genre_hint': track_req.genre_hint if track_req.genre_hint else None
                })

            # Process batch
            results = await self.metadata_service.batch_enrich_tracks(tracks_data)

            # Convert results to protobuf
            response_results = []
            for result in results:
                if result:
                    spotify_metadata = self._dict_to_spotify_metadata(result)
                    response_results.append(
                        metadata_pb2.EnrichTrackResponse(
                            success=True,
                            metadata=spotify_metadata,
                            confidence=result.get('confidence', 0.0)
                        )
                    )
                else:
                    response_results.append(
                        metadata_pb2.EnrichTrackResponse(
                            success=False,
                            error_message="No match found",
                            confidence=0.0
                        )
                    )

            return metadata_pb2.BatchEnrichResponse(results=response_results)

        except Exception as e:
            logger.error(f"Error in BatchEnrichTracks: {e}", exc_info=True)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return metadata_pb2.BatchEnrichResponse()

    async def SearchTracks(
        self,
        request: metadata_pb2.SearchRequest,
        context: grpc.aio.ServicerContext
    ) -> metadata_pb2.SearchResponse:
        """
        Search for tracks in Spotify.
        
        Args:
            request: SearchRequest protobuf message
            context: gRPC context
            
        Returns:
            SearchResponse protobuf message
        """
        try:
            logger.info(f"Received SearchTracks request: {request.query}")
            
            result = await self.metadata_service.search_tracks(
                query=request.query,
                limit=request.limit if request.limit else 20,
                offset=request.offset if request.offset else 0
            )

            # Convert to protobuf
            tracks = [
                self._dict_to_spotify_metadata(track)
                for track in result.get('tracks', [])
            ]

            return metadata_pb2.SearchResponse(
                tracks=tracks,
                total_results=result.get('total', 0)
            )

        except Exception as e:
            logger.error(f"Error in SearchTracks: {e}", exc_info=True)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return metadata_pb2.SearchResponse(tracks=[], total_results=0)

    def _dict_to_spotify_metadata(self, data: dict) -> metadata_pb2.SpotifyMetadata:
        """
        Convert dictionary to SpotifyMetadata protobuf message.
        
        Args:
            data: Dictionary with Spotify metadata
            
        Returns:
            SpotifyMetadata protobuf message
        """
        return metadata_pb2.SpotifyMetadata(
            spotify_id=data.get('spotify_id', ''),
            title=data.get('title', ''),
            artist=data.get('artist', ''),
            album=data.get('album', ''),
            genres=data.get('genres', []),
            release_date=data.get('release_date', ''),
            album_art_url=data.get('album_art_url', ''),
            preview_url=data.get('preview_url', ''),
            duration_ms=data.get('duration_ms', 0),
            popularity=float(data.get('popularity', 0)),
            confidence=float(data.get('confidence', 0.0)),
            external_url=data.get('external_url', ''),
            artists=data.get('artists', []),
            album_type=data.get('album_type', ''),
            track_number=data.get('track_number', 0),
            disc_number=data.get('disc_number', 1)
        )


class GRPCServer:
    """gRPC server manager."""
    
    def __init__(self):
        """Initialize gRPC server."""
        self.server: Optional[grpc.aio.Server] = None
        self.servicer: Optional[MetadataServicer] = None
        
    async def start(self):
        """Start the gRPC server."""
        # Create server
        self.server = grpc.aio.server(
            futures.ThreadPoolExecutor(max_workers=settings.grpc_max_workers),
            options=[
                ('grpc.max_send_message_length', 50 * 1024 * 1024),  # 50MB
                ('grpc.max_receive_message_length', 50 * 1024 * 1024),  # 50MB
            ]
        )
        
        # Add servicer
        self.servicer = MetadataServicer()
        metadata_pb2_grpc.add_MetadataServiceServicer_to_server(
            self.servicer, self.server
        )
        
        # Add reflection (enables grpcurl to work without .proto file)
        from grpc_reflection.v1alpha import reflection
        SERVICE_NAMES = (
            metadata_pb2.DESCRIPTOR.services_by_name['MetadataService'].full_name,
            reflection.SERVICE_NAME,
        )
        reflection.enable_server_reflection(SERVICE_NAMES, self.server)
        logger.info("gRPC reflection enabled")
        
        # Bind to address
        listen_addr = settings.grpc_address
        self.server.add_insecure_port(listen_addr)
        
        logger.info(f"Starting Metadata Service gRPC server on {listen_addr}")
        logger.info(f"Environment: {settings.environment}")
        logger.info(f"Debug mode: {settings.debug}")
        
        # Start server
        await self.server.start()
        logger.info("gRPC server started successfully")
        
    async def stop(self, grace_period: int = 5):
        """
        Stop the gRPC server gracefully.
        
        Args:
            grace_period: Time to wait for ongoing RPCs to complete
        """
        if self.server:
            logger.info(f"Stopping gRPC server (grace period: {grace_period}s)...")
            
            # Shutdown metadata service
            if self.servicer:
                await self.servicer.metadata_service.shutdown()
            
            # Stop server
            await self.server.stop(grace_period)
            logger.info("gRPC server stopped")
    
    async def wait_for_termination(self):
        """Wait for server termination."""
        if self.server:
            await self.server.wait_for_termination()


# Global server instance
_server: Optional[GRPCServer] = None


def get_server() -> GRPCServer:
    """Get or create server instance."""
    global _server
    if _server is None:
        _server = GRPCServer()
    return _server


async def serve():
    """Main server function."""
    server = get_server()
    
    # Setup signal handlers for graceful shutdown
    def signal_handler(signum, frame):
        logger.info(f"Received signal {signum}, initiating shutdown...")
        raise KeyboardInterrupt
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        await server.start()
        await server.wait_for_termination()
    except KeyboardInterrupt:
        logger.info("Shutdown signal received")
    finally:
        await server.stop()