package com.proyecto.spring.social_service.repository.social;

import com.proyecto.spring.social_service.model.social.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {
    List<Post> findByUserId(int userId);
}

