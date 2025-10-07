// scripts/init-mongo.js
// Script para inicializar la base de datos MongoDB

// Conectar a la base de datos musicshare
db = db.getSiblingDB('musicshare');

// Crear usuario para la aplicación
db.createUser({
  user: 'musicshare_user',
  pwd: 'musicshare_pass',
  roles: [
    {
      role: 'readWrite',
      db: 'musicshare'
    }
  ]
});

// Crear índices iniciales para las colecciones
db.createCollection('tracks');
db.createCollection('playlists');

// Índices para tracks
db.tracks.createIndex({ "user_id": 1 });
db.tracks.createIndex({ "created_at": -1 });
db.tracks.createIndex({ "is_public": 1 });
db.tracks.createIndex({ 
  "original_metadata.title": "text",
  "original_metadata.artist": "text",
  "enriched_metadata.title": "text",
  "enriched_metadata.artist": "text"
});

// Índices para playlists
db.playlists.createIndex({ "creator_id": 1 });
db.playlists.createIndex({ "created_at": -1 });
db.playlists.createIndex({ "is_public": 1 });
db.playlists.createIndex({ 
  "name": "text",
  "description": "text"
});

print('Database musicshare initialized successfully');