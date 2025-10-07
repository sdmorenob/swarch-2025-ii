import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, MoreVertical, ChevronLeft } from "lucide-react";

interface PostCardProps {
  imageUrl: string;
  audioUrl: string;
  comments: string[];
  onNavigate: () => void; // acción del botón izquierdo
}

const PostCard: React.FC<PostCardProps> = ({ imageUrl, audioUrl, comments, onNavigate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Reproduce / pausa
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Actualiza progreso
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration > 0) {
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const setAudioDuration = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", setAudioDuration);
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", setAudioDuration);
      audio.removeEventListener("ended", () => setIsPlaying(false));
    };
  }, []);

  // Permite hacer clic en la barra para adelantar/retroceder
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;

    audioRef.current.currentTime = newTime;
    setProgress((newTime / duration) * 100);
  };

  // Formatea el tiempo en mm:ss
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto border border-gray-400 rounded-xl p-3 bg-white shadow-md">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={onNavigate}
          className="text-gray-600 hover:text-blue-600 transition"
          title="Ir a perfil o endpoint"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="text-gray-600 hover:text-blue-600 transition"
          title="Ver comentarios"
        >
          <MoreVertical size={24} />
        </button>
      </div>

      {/* Imagen principal */}
      <div className="w-full aspect-video rounded-lg overflow-hidden border border-red-400 flex items-center justify-center">
        <img src={imageUrl} alt="Publicación" className="w-full h-full object-cover" />
      </div>

      {/* Reproductor estilo WhatsApp */}
      <div className="flex items-center mt-4 space-x-3">
        <button
          onClick={togglePlay}
          className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <div
          className="flex-1 h-2 bg-gray-300 rounded-full relative cursor-pointer"
          ref={progressBarRef}
          onClick={handleProgressClick}
        >
          <div
            className="absolute top-0 left-0 h-2 bg-red-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="text-xs text-gray-600 w-10 text-right">
          {formatTime(currentTime)}
        </span>

        <audio ref={audioRef} src={audioUrl} />
      </div>

      {/* Sección de comentarios */}
      {showComments && (
        <div className="mt-4 border-t border-gray-300 pt-2 text-sm text-gray-700 max-h-40 overflow-y-auto">
          {comments.length > 0 ? (
            comments.map((comment, idx) => (
              <div key={idx} className="border-b border-gray-200 py-1">
                {comment}
              </div>
            ))
          ) : (
            <p className="text-gray-500">Sin comentarios aún...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
