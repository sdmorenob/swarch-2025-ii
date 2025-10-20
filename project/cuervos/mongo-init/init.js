// Initialize MongoDB database for TaskNotes
// ----------------------------------------
// Este script se ejecuta automáticamente cuando el contenedor de MongoDB
// arranca por primera vez (montado en /docker-entrypoint-initdb.d/).
// Crea la base `tasknotes`, colecciones, validaciones de esquema y los índices
// necesarios para soportar el search-service y el backend.

// Selecciona/crea la base de datos `tasknotes`
db = db.getSiblingDB('tasknotes');

// Crea colecciones con validación ($jsonSchema) para asegurar consistencia
db.createCollection('notes', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'content', 'user_id', 'created_at', 'updated_at'],
      properties: {
        title: {
          bsonType: 'string',
          description: 'Note title is required and must be a string'
        },
        content: {
          bsonType: 'string',
          description: 'Note content is required and must be a string'
        },
        category: {
          bsonType: 'string',
          description: 'Note category must be a string'
        },
        tags: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          },
          description: 'Tags must be an array of strings'
        },
        user_id: {
          bsonType: 'int',
          description: 'User ID is required and must be an integer'
        },
        created_at: {
          bsonType: 'date',
          description: 'Created date is required'
        },
        updated_at: {
          bsonType: 'date',
          description: 'Updated date is required'
        }
      }
    }
  }
});

db.createCollection('note_history', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['note_id', 'action', 'user_id', 'timestamp'],
      properties: {
        note_id: {
          bsonType: 'objectId',
          description: 'Note ID is required and must be an ObjectId'
        },
        action: {
          bsonType: 'string',
          enum: ['created', 'updated', 'deleted'],
          description: 'Action must be one of: created, updated, deleted'
        },
        changes: {
          bsonType: 'object',
          description: 'Changes object containing the modifications'
        },
        user_id: {
          bsonType: 'int',
          description: 'User ID is required and must be an integer'
        },
        timestamp: {
          bsonType: 'date',
          description: 'Timestamp is required'
        }
      }
    }
  }
});

// Índices para rendimiento y búsqueda de texto
db.notes.createIndex({ user_id: 1 });
db.notes.createIndex({ title: 'text', content: 'text', tags: 'text' });
db.notes.createIndex({ created_at: -1 });
db.notes.createIndex({ updated_at: -1 });
db.notes.createIndex({ category: 1 });
db.notes.createIndex({ tags: 1 });

db.note_history.createIndex({ note_id: 1 });
db.note_history.createIndex({ user_id: 1 });
db.note_history.createIndex({ timestamp: -1 });
db.note_history.createIndex({ action: 1 });

// Crear usuario dedicado de aplicación (opcional). Si administras usuarios por
// entorno, deja esto comentado y gestiona roles con variables de entorno.
// db.createUser({
//   user: 'tasknotes_app',
//   pwd: 'app_password',
//   roles: [
//     {
//       role: 'readWrite',
//       db: 'tasknotes'
//     }
//   ]
// });

print('MongoDB initialization completed for TaskNotes database');