import { FormEvent, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

type LayoutContext = {
  theme?: "cupcake" | "dark";
  user?: {
    id?: string;
    _id?: string;
    user_id?: string;
    uuid?: string;
    email?: string;
    username?: string;
  };
};

type UploadState = "idle" | "loading" | "success" | "error";

export default function UploadMusic() {
  const { user } = useOutletContext<LayoutContext>();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [uploadedTrackId, setUploadedTrackId] = useState<string | null>(null);

  const userId = useMemo(
    () => user?.id || user?._id || user?.user_id || user?.uuid || "",
    [user]
  );

  const resetState = () => {
    setTitle("");
    setArtist("");
    setAudioFile(null);
  };

  const sendNotification = async (
    displayTitle: string,
    token: string | null
  ) => {
    if (!userId) return;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const payload = {
      recipient_id: userId,
      payload: {
        type: "music_upload",
        message: `Tu canción "${displayTitle}" se subió con éxito`,
        at: new Date().toISOString(),
      },
    };

    try {
      await fetch("/api/notifications/notify", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("No se pudo enviar la notificación", error);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadedTrackId(null);

    if (!userId) {
      setStatus("error");
      setMessage("No se encontró el usuario. Inicia sesión nuevamente.");
      return;
    }

    if (!audioFile) {
      setStatus("error");
      setMessage("Selecciona un archivo de audio.");
      return;
    }

    setStatus("loading");
    setMessage("Subiendo canción...");

    const token = localStorage.getItem("access_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append("file", audioFile);
    formData.append("user_id", userId);
    formData.append("is_public", "true");

    const tagList = [title.trim(), artist.trim()].filter(Boolean);
    if (tagList.length) {
      formData.append("tags", tagList.join(","));
    }

    try {
      const uploadResponse = await fetch("/api/music/api/v1/tracks/upload", {
        method: "POST",
        headers,
        body: formData,
      });

      const body = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok) {
        setStatus("error");
        setMessage(
          body?.error ||
            body?.message ||
            "No se pudo subir la canción. Intenta nuevamente."
        );
        return;
      }

      const uploadedTitle = title || body?.data?.original_metadata?.title || audioFile.name;
      const trackId = body?.data?._id || body?.data?.id || null;

      setUploadedTrackId(trackId);
      setStatus("success");
      setMessage(`Se subió "${uploadedTitle}" correctamente.`);

      await sendNotification(uploadedTitle, token);
      resetState();
    } catch (error) {
      console.error("Error subiendo canción", error);
      setStatus("error");
      setMessage("Ocurrió un error inesperado. Intenta nuevamente.");
    }
  };

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase text-primary tracking-wide">
          Upload Center
        </p>
        <h1 className="text-3xl font-bold text-base-content">Subir nueva canción</h1>
        <p className="text-base-content/70">
          Completa los datos y adjunta tu archivo de audio. La carga se realiza a
          través del API Gateway usando multipart/form-data.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="form-control w-full">
            <span className="label-text text-sm font-semibold">Título</span>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Nombre de tu track"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="form-control w-full">
            <span className="label-text text-sm font-semibold">Artista</span>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Tu nombre artístico"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
          </label>
        </div>

        <label className="form-control w-full">
          <span className="label-text text-sm font-semibold">Archivo de audio</span>
          <input
            type="file"
            accept="audio/*"
            className="file-input file-input-bordered w-full"
            onChange={(event) => setAudioFile(event.target.files?.[0] || null)}
          />
          {audioFile && (
            <span className="label-text-alt text-base-content/70">
              Archivo seleccionado: {audioFile.name}
            </span>
          )}
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className={`btn btn-primary ${status === "loading" ? "loading" : ""}`}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Subiendo..." : "Subir canción"}
          </button>

          {status === "success" && message && (
            <div className="alert alert-success flex-1">
              <span>{message}</span>
            </div>
          )}

          {status === "error" && message && (
            <div className="alert alert-error flex-1">
              <span>{message}</span>
            </div>
          )}
        </div>

        {uploadedTrackId && (
          <div className="alert alert-info">
            <span>
              Track creado con ID {uploadedTrackId}. Revisa tu biblioteca o el
              enlace de streaming cuando el procesamiento termine.
            </span>
          </div>
        )}
      </form>
    </section>
  );
}
