export default function UploadMusicSSR() {
  return (
    <div style={{ width: "100%", height: "100vh", border: "none" }}>
      <iframe
        src="/upload"
        title="UploadMusic"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          overflow: "hidden",
        }}
      />
    </div>
  );
}
