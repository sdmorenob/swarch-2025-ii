"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Music2,
  Tag,
  Globe,
  Lock,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react";
import Toast from "../components/Toast";

type Props = { theme: "cupcake" | "dark" };

export default function UploadMusic({ theme }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [uploadedTrackId, setUploadedTrackId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const USER_ID = 1;

  const showMessage = (msg: string, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUploadTrack = async () => {
    if (!selectedFile) {
      showMessage("Selecciona un archivo de música antes de subirlo.", true);
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("user_id", String(USER_ID));
    formData.append("is_public", isPublic.toString());
    formData.append("tags", tags);

    try {
      const response = await fetch(
        "https://localhost/api/music/api/v1/tracks/upload",
        { method: "POST", body: formData }
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setUploadedTrackId(data.data.id);
        setToast({ message: "Canción subida con éxito.", type: "success" });
      } else {
        showMessage(
          `Error al subir: ${data.error || "Error desconocido"}`,
          true
        );
      }
    } catch (err) {
      showMessage("Error de conexión con el servidor.", true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!uploadedTrackId) {
      showMessage("Primero sube una canción antes de crear el post.", true);
      return;
    }

    setIsCreatingPost(true);
    const hashtagsArray = hashtags
      .split(/[, ]+/)
      .filter((h) => h.trim() !== "")
      .map((h) => (h.startsWith("#") ? h : `#${h}`));

    const postData = {
      userId: USER_ID,
      trackId: uploadedTrackId,
      caption,
      hashtags: hashtagsArray,
    };

    try {
      const response = await fetch(
        "https://localhost/api/social/posts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        }
      );
      const data = await response.json();

      if (response.ok) {
        setToast({ message: "Publicación creada con éxito.", type: "success" });
      } else {
        showMessage(
          `Error al crear post: ${data.error || "Error desconocido"}`,
          true
        );
      }
    } catch (err) {
      showMessage("Error al conectar con SocialService.", true);
    } finally {
      setIsCreatingPost(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6" data-theme={theme}>
      {toast && (
        <Toast message={toast.message} id={Date.now()} type={toast.type} />
      )}
      {/* Header mejorado */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-xl">
          <Sparkles
            size={32}
            className="text-primary-content"
            strokeWidth={2.5}
          />
        </div>
        <div>
          <h1 className="text-5xl font-bold text-base-content">
            Crear Publicación
          </h1>
          <p className="text-base-content/60 text-lg mt-1">
            Comparte tu música con la comunidad
          </p>
        </div>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div
          className={`alert ${
            isError ? "alert-error" : "alert-success"
          } shadow-lg`}
        >
          {isError ? <XCircle size={22} /> : <CheckCircle size={22} />}
          <span className="font-medium text-base">{message}</span>
        </div>
      )}

      {/* Card 1: Subir música */}
      <div className="card bg-base-200 shadow-2xl border border-base-300">
        <div className="card-body p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Music2 className="text-primary" size={28} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-bold text-base-content">
              1. Subir Canción
            </h2>
          </div>

          {/* Drop Zone mejorada */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-3 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 ${
              isDragging
                ? "border-primary bg-primary/10 scale-[1.01]"
                : "border-base-300 hover:border-primary hover:bg-base-300/50"
            }`}
          >
            <Upload
              size={64}
              className={`mx-auto mb-4 transition-all ${
                isDragging
                  ? "text-primary animate-bounce"
                  : "text-base-content/40"
              }`}
              strokeWidth={1.5}
            />
            <p className="text-xl font-semibold text-base-content mb-2">
              {selectedFile ? (
                <span className="flex items-center justify-center gap-2">
                  <Music2 size={22} className="text-primary" />
                  {selectedFile.name}
                </span>
              ) : (
                "Arrastra tu archivo aquí"
              )}
            </p>
            <p className="text-base text-base-content/60 mb-4">
              o haz clic para seleccionar
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["MP3", "WAV", "FLAC", "M4A", "OGG", "AAC"].map((format) => (
                <span
                  key={format}
                  className="badge badge-outline badge-lg font-semibold"
                >
                  {format}
                </span>
              ))}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.flac,.m4a,.ogg,.aac"
              onChange={handleFileSelect}
              hidden
            />
          </div>

          {/* Inputs en grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="form-control">
              <label className="label pb-2 mr-2">
                <span className="label-text font-bold text-lg flex items-center gap-2 text-base-content">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Tag size={18} className="text-primary" />
                  </div>
                  Tags
                </span>
              </label>
              <input
                type="text"
                placeholder="rock, indie, chill"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="input input-bordered input-lg text-base focus:input-primary"
              />
              <label className="label pt-2">
                <span className="label-text-alt text-base-content/50">
                  Separa con comas
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label pb-2 mr-2">
                <span className="label-text font-bold text-lg flex items-center gap-2 text-base-content">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isPublic ? "bg-success/10" : "bg-warning/10"
                    }`}
                  >
                    {isPublic ? (
                      <Globe size={18} className="text-success" />
                    ) : (
                      <Lock size={18} className="text-warning" />
                    )}
                  </div>
                  Visibilidad
                </span>
              </label>
              <select
                value={isPublic.toString()}
                onChange={(e) => setIsPublic(e.target.value === "true")}
                className="select select-bordered select-lg text-base focus:select-primary"
              >
                <option value="true">🌍 Pública - Todos pueden ver</option>
                <option value="false">🔒 Privada - Solo tú</option>
              </select>
              <label className="label pt-2">
                <span className="label-text-alt text-base-content/50">
                  {isPublic ? "Visible para todos" : "Solo tú puedes ver"}
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={handleUploadTrack}
            className="btn btn-primary btn-lg mt-8 w-full text-base"
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <span className="loading loading-spinner loading-md"></span>
                Subiendo...
              </>
            ) : (
              <>
                <Upload size={22} />
                Subir Canción
              </>
            )}
          </button>
        </div>
      </div>

      {/* Card 2: Crear post */}
      <div
        className={`card bg-base-200 shadow-2xl border border-base-300 transition-all ${
          uploadedTrackId ? "opacity-100" : "opacity-60"
        }`}
      >
        <div className="card-body p-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                uploadedTrackId ? "bg-success/10" : "bg-base-content/10"
              }`}
            >
              <CheckCircle
                className={
                  uploadedTrackId ? "text-success" : "text-base-content/30"
                }
                size={28}
                strokeWidth={2.5}
              />
            </div>
            <h2 className="text-3xl font-bold text-base-content">
              2. Crear Publicación
            </h2>
          </div>

          <div className="form-control">
            <label className="label mr-2">
              <span className="label-text font-bold text-base">
                Descripción
              </span>
              <span className="label-text-alt text-base-content/60 font-medium">
                {caption.length}/500
              </span>
            </label>
            <textarea
              placeholder="¿Qué quieres compartir sobre esta canción?"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              className="textarea textarea-bordered textarea-lg h-36 resize-none text-base"
              disabled={!uploadedTrackId}
            />
          </div>

          <div className="form-control mt-6">
            <label className="label mr-2">
              <span className="label-text font-bold text-base">Hashtags</span>
            </label>
            <input
              type="text"
              placeholder="#música #indie #cover"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="input input-bordered input-lg text-base"
              disabled={!uploadedTrackId}
            />
            <label className="label ml-2">
              <span className="label-text-alt text-base-content/50">
                Separa los hashtags con comas o espacios
              </span>
            </label>
          </div>

          <button
            onClick={handleCreatePost}
            className="btn btn-success btn-lg mt-6 w-full text-base"
            disabled={!uploadedTrackId || isCreatingPost}
          >
            {isCreatingPost ? (
              <>
                <span className="loading loading-spinner loading-md"></span>
                Publicando...
              </>
            ) : (
              <>
                <CheckCircle size={22} />
                Publicar Post
              </>
            )}
          </button>

          {!uploadedTrackId && (
            <div className="alert alert-warning mt-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="font-medium">
                Primero debes subir una canción
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
