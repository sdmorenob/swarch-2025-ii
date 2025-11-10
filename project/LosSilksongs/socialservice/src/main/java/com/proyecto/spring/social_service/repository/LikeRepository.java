package com.proyecto.spring.social_service.repository;

import com.proyecto.spring.social_service.model.Like;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LikeRepository extends JpaRepository<Like, UUID> {
    List<Like> findByPostId(UUID postId);
    List<Like> findByUserId(UUID userId);
    boolean existsByUserIdAndPostId(UUID userId, UUID postId);
}