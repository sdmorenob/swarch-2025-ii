'use client';

import { useEffect, useState } from 'react';
import { CreatePost } from '@/components/create-post';
import { PostCard } from '@/components/post-card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { getPosts, getCurrentUser } from '@/lib/api';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [page]);

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUserEmail(user.correo || user.email);
    } catch (err: any) {
      console.error('Error loading user:', err);
    }
  };

  const loadPosts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getPosts(page, 10);
      setPosts(data.posts);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostCreated = () => {
    setPage(1);
    loadPosts();
  };

  const handlePostDeleted = (postId: number) => {
    setPosts(posts.filter((post: any) => post.id !== postId));
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Feed de Publicaciones</h1>

      <div className="space-y-6">
        <CreatePost onPostCreated={handlePostCreated} />

        {isLoading && posts.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <Button onClick={loadPosts} className="mt-4">
              Reintentar
            </Button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay publicaciones aún. ¡Sé el primero en publicar!</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {posts.map((post: any) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserEmail={currentUserEmail}
                  onDelete={handlePostDeleted}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1 || isLoading}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages || isLoading}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
