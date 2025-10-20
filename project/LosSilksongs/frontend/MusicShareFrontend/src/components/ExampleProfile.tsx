import React from "react";
import ProfileView from "./Inputs/ProfileView";

const ExampleProfile = () => {
  return (
    <ProfileView
      profileImage="https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg"
      description="Músico y productor. Amante de la mezcla y el ritmo 🎶"
      numPosts={7}
      numFriends={6}
      posts={[
        { id: 1, imageUrl: "https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg" },
        { id: 2, imageUrl: "https://images.pexels.com/photos/1476880/pexels-photo-1476880.jpeg" },
        { id: 3, imageUrl: "https://images.pexels.com/photos/1576667/pexels-photo-1576667.jpeg" },
        { id: 4, imageUrl: "https://images.pexels.com/photos/1464081/pexels-photo-1464081.jpeg" },
      ]}
    />
  );
};

export default ExampleProfile;
