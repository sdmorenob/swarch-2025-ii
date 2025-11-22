package com.proyecto.spring.social_service.repository.social;

import com.proyecto.spring.social_service.model.social.Like;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LikeRepository extends JpaRepository<Like, UUID> {
    List<Like> findByPostId(UUID postId);
    List<Like> findByUserId(int userId);
    boolean existsByUserIdAndPostId(int userId, UUID postId);
}