import React from "react";
import PostCard from "./Inputs/PostMusicCard";
import cinematicAudio from "./supportFiles/cinematic-background-inspirational-150013.mp3";
// import image1 from "./supportFiles/imagen.PNG";
//import audio1 from "../supportFiles/PESSONOVANTE.mp3";


export const ProfileFeed = ({ posts = [] }) => {
  const defaultPost = {
    imageUrl: "https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg",
    audioUrl: cinematicAudio,
    comments: ["Buen tema 🎶", "Me encantó el ritmo", "Sube más contenido!"],
    onNavigate: () => window.location.href = "/profile"
  };

  const postsToShow = posts.length > 0 ? posts : [defaultPost];

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex justify-center"
      style={{
        backgroundImage: "url('https://images.pexels.com/photos/6793712/pexels-photo-6793712.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {postsToShow.map((post, index) => (
        <PostCard
          key={index}
          imageUrl={post.imageUrl}
          audioUrl={post.audioUrl}
          comments={post.comments}
          onNavigate={post.onNavigate}
        />
      ))}
    </div>
  );
};