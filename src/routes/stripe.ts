import Stripe from 'stripe';
import { Request, Response, Router } from 'express';
import { client } from '../config/clients/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { AuthRequest } from '../utils/types.js';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
   apiVersion: '2025-06-30.basil'
});


router.get('/products', async (req: Request, res: Response) => {
  try {
    
    const products = await stripe.products.list({ limit: 10 });
    res.json({ success: true, data: products.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router };
