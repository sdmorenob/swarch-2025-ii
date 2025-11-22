package com.proyecto.spring.social_service.repository.social;

import com.proyecto.spring.social_service.model.social.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    List<Comment> findByPostId(UUID postId);
    List<Comment> findByParentCommentId(UUID parentCommentId);
}