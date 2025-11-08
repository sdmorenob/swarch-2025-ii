package com.proyecto.spring.social_service.controllers;

import com.proyecto.spring.social_service.model.Post;
import com.proyecto.spring.social_service.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.UUID;

@Tag(name = "Posts", description = "Operaciones relacionadas con publicaciones de usuarios")
@RestController
@RequestMapping("/api/social/posts")
@CrossOrigin
public class PostController {

    @Autowired
    private PostRepository postRepository;

    @Operation(
            summary = "Crear una publicación",
            description = "Crea una nueva publicación de un usuario. Debe incluir solo `trackId` o `playlistId`, pero no ambos.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Publicación creada correctamente",
                            content = @Content(schema = @Schema(implementation = Post.class))),
                    @ApiResponse(responseCode = "400", description = "Datos inválidos — faltan o sobran referencias"),
                    @ApiResponse(responseCode = "500", description = "Error interno del servidor")
            }
    )
    @PostMapping
    public ResponseEntity<?> crearPost(@RequestBody Post post) {
        if (!post.hasValidReference()) {
        return ResponseEntity.badRequest().body("Debe especificar solo trackId o playlistId, no ambos ni ninguno.");
        }
        post.setCreatedAt(java.time.LocalDateTime.now());
        post.setUpdatedAt(java.time.LocalDateTime.now());
        return ResponseEntity.ok(postRepository.save(post));
    }

    @Operation(
            summary = "Obtener todas las publicaciones",
            description = "Devuelve una lista de todas las publicaciones creadas en la red social.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Lista de publicaciones obtenida correctamente",
                            content = @Content(schema = @Schema(implementation = Post.class)))
            }
    )
    @GetMapping
    public List<Post> obtenerTodos() {
        return postRepository.findAll();
    }

    @Operation(
            summary = "Obtener publicaciones de un usuario",
            description = "Obtiene todas las publicaciones asociadas a un usuario específico.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Publicaciones del usuario obtenidas correctamente",
                            content = @Content(schema = @Schema(implementation = Post.class))),
                    @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
            }
    )
    @GetMapping("/usuario/{userId}")
    public List<Post> obtenerPorUsuario(
            @Parameter(description = "ID del usuario")    
            @PathVariable UUID userId) {
        return postRepository.findByUserId(userId);
    }

    @Operation(
            summary = "Eliminar una publicación",
            description = "Elimina una publicación existente mediante su ID.",
            responses = {
                    @ApiResponse(responseCode = "204", description = "Publicación eliminada correctamente"),
                    @ApiResponse(responseCode = "404", description = "Publicación no encontrada")
            }
    )
    @DeleteMapping("/{postId}")
    public void eliminarPost(
            @Parameter(description = "ID de la publicación")
            @PathVariable UUID postId) {
        postRepository.deleteById(postId);
    }
}