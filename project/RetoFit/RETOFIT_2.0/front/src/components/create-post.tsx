'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { createPost, uploadPostImage } from '@/lib/api';

export function CreatePost({ onPostCreated }: { onPostCreated?: () => void }) {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // Crear el post
      const newPost = await createPost(content);

      // Si hay imagen, subirla
      if (selectedImage && newPost.id) {
        const formData = new FormData();
        formData.append('image', selectedImage);
        await uploadPostImage(newPost.id, formData);
      }

      // Limpiar formulario
      setContent('');
      setSelectedImage(null);
      setImagePreview(null);

      // Notificar al padre
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="¿Qué estás pensando?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
            className="min-h-[100px] resize-none"
          />

          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-auto rounded-lg max-h-96 object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={removeImage}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => document.getElementById('post-image')?.click()}
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Imagen
              </Button>
              <input
                id="post-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" disabled={isLoading || !content.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publicar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
