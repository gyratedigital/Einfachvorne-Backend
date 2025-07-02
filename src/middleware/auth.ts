import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
     res.status(401).json({ data: null, error: 'Unauthorized User', });
     return
  }

  const token = authHeader.split(' ')[1]; 

  try {
    
    jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch (error) {
     res.status(401).json({ data: null, error: 'Invalid or expired token', })
     return
  }
};
