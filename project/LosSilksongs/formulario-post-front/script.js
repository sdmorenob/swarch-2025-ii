const dropZone = document.getElementById("dropZone");
const musicFileInput = document.getElementById("musicFile");
const uploadTrackBtn = document.getElementById("uploadTrackBtn");
const createPostBtn = document.getElementById("createPostBtn");
const messageBox = document.getElementById("messageBox");

let uploadedTrackId = null;

// Simulación temporal del ID de usuario (hasta integrar login)
const USER_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

// === Drag and Drop ===
dropZone.addEventListener("click", () => musicFileInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");

  const file = e.dataTransfer.files[0];
  if (file) {
    musicFileInput.files = e.dataTransfer.files;
    dropZone.querySelector("p").textContent = `Archivo seleccionado: ${file.name}`;
  }
});

// === Subir canción a MusicService ===
uploadTrackBtn.addEventListener("click", async () => {
  const file = musicFileInput.files[0];
  const tags = document.getElementById("tags").value;
  const isPublic = document.getElementById("isPublic").value;

  if (!file) {
    showMessage("Selecciona un archivo de música antes de subirlo.", true);
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_id", USER_ID);
  formData.append("is_public", isPublic);
  formData.append("tags", tags);

  try {
    const response = await fetch("https://localhost/api/music/api/v1/tracks/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok && data.success) {
      uploadedTrackId = data.data.id;
      showMessage(`🎵 Canción subida con éxito. ID: ${uploadedTrackId}`);
    } else {
      showMessage(`Error al subir: ${data.error || "Error desconocido"}`, true);
    }
  } catch (err) {
    showMessage("Error de conexión con el servidor.", true);
  }
});

// === Crear post en SocialService ===
createPostBtn.addEventListener("click", async () => {
  if (!uploadedTrackId) {
    showMessage("Primero sube una canción antes de crear el post.", true);
    return;
  }

  const caption = document.getElementById("caption").value;
  const hashtagsInput = document.getElementById("hashtags").value;

  const hashtags = hashtagsInput
    .split(/[, ]+/)
    .filter((h) => h.trim() !== "")
    .map((h) => (h.startsWith("#") ? h : `#${h}`));

  const postData = {
    userId: USER_ID,
    trackId: uploadedTrackId,
    caption,
    hashtags,
  };

  try {
    const response = await fetch("https://localhost/api/social/api/social/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(`✅ Post creado exitosamente (ID: ${data.postId})`);
    } else {
      showMessage(`Error al crear post: ${data.error || "Error desconocido"}`, true);
    }
  } catch (err) {
    showMessage("Error al conectar con SocialService.", true);
  }
});

function showMessage(msg, isError = false) {
  messageBox.textContent = msg;
  messageBox.style.color = isError ? "#ff4d4d" : "#7fff7f";
}
