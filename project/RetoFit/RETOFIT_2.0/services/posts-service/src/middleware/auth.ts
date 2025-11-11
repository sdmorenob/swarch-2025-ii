import { Request, Response, NextFunction } from 'express';
import jwt, { Algorithm } from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY!;
const ALGORITHM = (process.env.ALGORITHM || 'HS256') as Algorithm;

export interface AuthRequest extends Request {
  userEmail?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No se encontró token de acceso. Por favor, inicie sesión.' });
    }

    const token = authHeader.split(' ')[1]; // "Bearer TOKEN"
    
    if (!token) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const payload = jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] }) as any;
    
    req.userEmail = payload.sub;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión expirada' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};
