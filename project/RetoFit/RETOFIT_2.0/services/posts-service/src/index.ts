import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import postsRouter from './routes/posts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8005;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/posts', postsRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Posts Service' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`Posts service running on http://localhost:${PORT}`);
});
