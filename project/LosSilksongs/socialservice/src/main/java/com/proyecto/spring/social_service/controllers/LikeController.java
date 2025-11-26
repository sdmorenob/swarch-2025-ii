package com.proyecto.spring.social_service.controllers;

import com.proyecto.spring.social_service.model.social.Like;
import com.proyecto.spring.social_service.repository.social.LikeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Tag(name = "Likes", description = "Operaciones relacionadas con los 'me gusta' de los posts")
@RestController
@RequestMapping("/api/social/likes")
@CrossOrigin
public class LikeController {

    @Autowired
    private LikeRepository likeRepository;

    @Operation(
            summary = "Crear un nuevo like",
            description = "Permite registrar un nuevo 'me gusta' en un post por parte de un usuario. " +
                          "Si el usuario ya dio like al post, se lanza un error.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Like creado correctamente",
                            content = @Content(schema = @Schema(implementation = Like.class))),
                    @ApiResponse(responseCode = "400", description = "El usuario ya dio like a este post"),
                    @ApiResponse(responseCode = "500", description = "Error interno del servidor")
            }
    )
    @PostMapping
    public Like crearLike(@RequestBody Like like) {
        if (likeRepository.existsByUserIdAndPostId(like.getUserId(), like.getPostId())) {
            throw new RuntimeException("El usuario ya dio like a este post");
        }
        like.setCreatedAt(LocalDateTime.now());
        return likeRepository.save(like);
    }

    @Operation(
            summary = "Obtener likes por post",
            description = "Devuelve una lista con todos los likes asociados a un post específico.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Lista de likes obtenida correctamente",
                            content = @Content(schema = @Schema(implementation = Like.class))),
                    @ApiResponse(responseCode = "404", description = "Post no encontrado")
            }
    )
    @GetMapping("/post/{postId}")
    public List<Like> obtenerLikesPorPost(
            @Parameter(description = "ID del post para el cual se desean obtener los likes") 
            @PathVariable UUID postId) {
        return likeRepository.findByPostId(postId);
    }

    @Operation(
            summary = "Eliminar un like",
            description = "Permite eliminar un like existente por su ID.",
            responses = {
                    @ApiResponse(responseCode = "204", description = "Like eliminado correctamente"),
                    @ApiResponse(responseCode = "404", description = "Like no encontrado")
            }
    )
    @DeleteMapping("/{likeId}")
    public void eliminarLike(
            @Parameter(description = "ID del like que se desea eliminar") 
            @PathVariable UUID likeId) {
        likeRepository.deleteById(likeId);
    }
}
