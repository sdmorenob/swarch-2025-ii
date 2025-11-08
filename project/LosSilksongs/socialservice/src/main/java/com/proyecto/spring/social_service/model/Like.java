package com.proyecto.spring.social_service.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "likes")
public class Like {

    @Id
    @GeneratedValue
    @Column(name = "like_id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID likeId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "post_id", nullable = false)
    private UUID postId;

    @Column(name = "created_at")
    private LocalDateTime created_at = LocalDateTime.now();

    // Getters y setters

    public UUID getLikeId() {
        return likeId;
    }

    public void setLikeId(UUID likeId) {
        this.likeId = likeId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getPostId() {
        return postId;
    }

    public void setPostId(UUID postId) {
        this.postId = postId;
    }

    public LocalDateTime getCreatedAt() {
        return created_at;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.created_at = createdAt;
    }
}
