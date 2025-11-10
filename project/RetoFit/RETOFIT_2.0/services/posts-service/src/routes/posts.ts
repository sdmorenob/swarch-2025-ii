import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { upload } from '../config/multer';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';
import fs from 'fs';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

// Obtener todos los posts (feed) con paginación
router.get('/posts', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 3, // Solo mostrar últimos 3 comentarios
        },
        likes: {
          select: { userEmail: true }
        }
      }
    });

    // Formatear la respuesta
    const formattedPosts = posts.map((post: any) => ({
      ...post,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
      isLikedByUser: post.likes.some(like => like.userEmail === req.userEmail),
      // La URL ya viene completa de Cloudinary o es null
      imageUrl: post.imageUrl
    }));

    const total = await prisma.post.count();

    res.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un post específico
router.get('/posts/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const postId = parseInt(req.params.id);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' }
        },
        likes: {
          select: { userEmail: true }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    const formattedPost = {
      ...post,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
      isLikedByUser: post.likes.some(like => like.userEmail === req.userEmail),
      imageUrl: post.imageUrl // URL completa de Cloudinary
    };

    res.json(formattedPost);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear un nuevo post
router.post('/posts', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'El contenido no puede estar vacío' });
    }

    const post = await prisma.post.create({
      data: {
        content,
        userEmail: req.userEmail!
      },
      include: {
        comments: true,
        likes: true
      }
    });

    res.status(201).json({
      ...post,
      likesCount: 0,
      commentsCount: 0,
      isLikedByUser: false
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Subir imagen a un post (ahora usando Cloudinary)
router.post('/posts/:id/upload', authMiddleware, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    const postId = parseInt(req.params.id);

    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ninguna imagen' });
    }

    // Verificar que el post existe y pertenece al usuario
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      fs.unlinkSync(req.file.path); // Eliminar archivo temporal
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    if (post.userEmail !== req.userEmail) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'No tienes permiso para modificar este post' });
    }

    // Subir imagen a Cloudinary
    // La función uploadToCloudinary optimiza y elimina el archivo temporal automáticamente
    const cloudinaryUrl = await uploadToCloudinary(req.file.path);

    // Eliminar imagen anterior de Cloudinary si existe
    if (post.imageUrl) {
      await deleteFromCloudinary(post.imageUrl);
    }

    // Actualizar post con URL de Cloudinary
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        imageUrl: cloudinaryUrl // Guardar URL completa de Cloudinary
      },
      include: {
        comments: true,
        likes: true
      }
    });

    res.json({
      ...updatedPost,
      likesCount: updatedPost.likes.length,
      commentsCount: updatedPost.comments.length,
      isLikedByUser: updatedPost.likes.some(like => like.userEmail === req.userEmail)
    });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Actualizar un post
router.put('/posts/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { content } = req.body;

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    if (post.userEmail !== req.userEmail) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este post' });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { content },
      include: {
        comments: true,
        likes: true
      }
    });

    res.json({
      ...updatedPost,
      likesCount: updatedPost.likes.length,
      commentsCount: updatedPost.comments.length,
      isLikedByUser: updatedPost.likes.some(like => like.userEmail === req.userEmail),
      imageUrl: updatedPost.imageUrl ? `${process.env.API_BASE_URL || 'http://localhost:8005'}${updatedPost.imageUrl}` : null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar un post
router.delete('/posts/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const postId = parseInt(req.params.id);

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    if (post.userEmail !== req.userEmail) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este post' });
    }

    // Eliminar imagen si existe
    if (post.imageUrl) {
      const imagePath = path.join('.', post.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await prisma.post.delete({
      where: { id: postId }
    });

    res.json({ message: 'Post eliminado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- COMENTARIOS ---

// Obtener comentarios de un post
router.get('/posts/:id/comments', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const postId = parseInt(req.params.id);

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(comments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear un comentario
router.post('/posts/:id/comments', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    }

    // Verificar que el post existe
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userEmail: req.userEmail!
      }
    });

    res.status(201).json(comment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar un comentario
router.delete('/comments/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const commentId = parseInt(req.params.id);

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    if (comment.userEmail !== req.userEmail) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este comentario' });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.json({ message: 'Comentario eliminado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- LIKES ---

// Toggle like en un post
router.post('/posts/:id/like', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const postId = parseInt(req.params.id);

    // Verificar que el post existe
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Verificar si ya existe el like
    const existingLike = await prisma.like.findFirst({
      where: {
        postId,
        userEmail: req.userEmail!
      }
    });

    if (existingLike) {
      // Si existe, eliminar (unlike)
      await prisma.like.delete({
        where: { id: existingLike.id }
      });

      res.json({ message: 'Like eliminado', liked: false });
    } else {
      // Si no existe, crear (like)
      await prisma.like.create({
        data: {
          postId,
          userEmail: req.userEmail!
        }
      });

      res.json({ message: 'Like agregado', liked: true });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener likes de un post
router.get('/posts/:id/likes', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const postId = parseInt(req.params.id);

    const likes = await prisma.like.findMany({
      where: { postId },
      select: {
        userEmail: true,
        createdAt: true
      }
    });

    res.json({
      count: likes.length,
      likes: likes
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
