package com.proyecto.spring.social_service.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "post")
public class Post {

    @Id
    @GeneratedValue
    @Column(name = "post_id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID postId;

    @Column(name = "user_id", nullable = false)
    private UUID userId; // referencia al usuario (del UserService)

    @Column(name = "track_id", nullable = true)
    private String trackId; // referencia al track de MongoDB

    @Column(name = "playlist_id", nullable = true)
    private String playlistId;

    private String caption;

    @ElementCollection
    @CollectionTable(
        name = "post_hashtags",
        joinColumns = @JoinColumn(name = "post_post_id")
    )
    private List<String> hashtags;

    private LocalDateTime created_at = LocalDateTime.now();
    private LocalDateTime updated_at = LocalDateTime.now();

    // Getters y setters
    public UUID getPostId() { return postId; }
    public void setPostId(UUID postId) { this.postId = postId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getTrackId() { return trackId; }
    public void setTrackId(String trackId) { this.trackId = trackId; }

    public String getPlaylistId() { return playlistId; }
    public void setPlaylistId(String playlistId) { this.playlistId = playlistId; }

    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }

    public List<String> getHashtags() { return hashtags; }
    public void setHashtags(List<String> hashtags) { this.hashtags = hashtags; }

    public LocalDateTime getCreatedAt() { return created_at; }
    public void setCreatedAt(LocalDateTime createdAt) { this.created_at = createdAt; }

    public LocalDateTime getUpdatedAt() { return updated_at; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updated_at = updatedAt; }

    //Validación lógica cancion o playlist
    public boolean hasValidReference() {
        return (trackId != null && playlistId == null) || (trackId == null && playlistId != null);
        }
}
