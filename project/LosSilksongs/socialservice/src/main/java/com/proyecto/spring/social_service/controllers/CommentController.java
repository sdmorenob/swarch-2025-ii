package com.proyecto.spring.social_service.controllers;

import com.proyecto.spring.social_service.model.social.Comment;
import com.proyecto.spring.social_service.repository.social.CommentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
import java.util.Optional;

@Tag(name = "Comments", description = "Operaciones relacionadas con comentarios y respuestas en publicaciones")
@RestController
@RequestMapping("/api/social/comments")
@CrossOrigin
public class CommentController {

    @Autowired
    private CommentRepository commentRepository;

    @Operation(
            summary = "Crear comentario en un post",
            description = "Permite a un usuario crear un comentario asociado a un post específico.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Comentario creado correctamente",
                            content = @Content(schema = @Schema(implementation = Comment.class))),
                    @ApiResponse(responseCode = "404", description = "Post no encontrado")
            }
    )
    @PostMapping("/post/{postId}")
    public Comment createComment(
            @Parameter(description = "ID del post al que pertenece el comentario")
            @PathVariable UUID postId,
            @RequestBody Comment comment) {
        comment.setPostId(postId);
        return commentRepository.save(comment);
    }

@Operation(
            summary = "Responder a un comentario",
            description = "Permite crear una respuesta a un comentario existente. La respuesta se asocia al mismo post que el comentario padre.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Respuesta creada correctamente",
                            content = @Content(schema = @Schema(implementation = Comment.class))),
                    @ApiResponse(responseCode = "404", description = "Comentario padre no encontrado")
            }
    )
    @PostMapping("/reply/{commentId}")
    public ResponseEntity<Comment> responderComentario(
            @Parameter(description = "ID del comentario al que se desea responder")
            @PathVariable UUID commentId,
            @RequestBody Comment reply) {
        Optional<Comment> parentComment = commentRepository.findById(commentId);

        if (parentComment.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Asignar relaciones
        reply.setParentCommentId(commentId);
        reply.setPostId(parentComment.get().getPostId());
        reply.setCreatedAt(LocalDateTime.now());
        reply.setUpdatedAt(LocalDateTime.now());

        Comment nuevoComentario = commentRepository.save(reply);
        return ResponseEntity.ok(nuevoComentario);
    }


    @Operation(
            summary = "Obtener comentarios de un post",
            description = "Devuelve todos los comentarios asociados a un post.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Comentarios obtenidos correctamente",
                            content = @Content(schema = @Schema(implementation = Comment.class))),
                    @ApiResponse(responseCode = "404", description = "Post no encontrado")
            }
    )
    @GetMapping("/post/{postId}")
    public List<Comment> getCommentsByPost(
            @Parameter(description = "ID del post del cual obtener los comentarios")
            @PathVariable UUID postId) {
        return commentRepository.findByPostId(postId);
    }

    @Operation(
            summary = "Obtener respuestas a un comentario",
            description = "Devuelve todas las respuestas asociadas a un comentario padre.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Respuestas obtenidas correctamente",
                            content = @Content(schema = @Schema(implementation = Comment.class)))
            }
    )
    @GetMapping("/replies/{parentCommentId}")
    public List<Comment> getReplies(
            @Parameter(description = "ID del comentario padre")
            @PathVariable UUID parentCommentId) {
        return commentRepository.findByParentCommentId(parentCommentId);
    }

     @Operation(
            summary = "Eliminar un comentario",
            description = "Permite eliminar un comentario existente mediante su ID.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Comentario eliminado correctamente"),
                    @ApiResponse(responseCode = "404", description = "Comentario no encontrado")
            }
    )
    @DeleteMapping("/{commentId}")
    public String deleteComment(
            @Parameter(description = "ID del comentario a eliminar")
            @PathVariable UUID commentId) {
        Optional<Comment> comment = commentRepository.findById(commentId);
        if (comment.isPresent()) {
            commentRepository.deleteById(commentId);
            return "Comentario eliminado correctamente.";
        } else {
            return "Comentario no encontrado.";
        }
    }
}
