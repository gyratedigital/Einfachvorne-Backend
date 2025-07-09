import Stripe from 'stripe';
import { Request, Response, Router } from 'express';
import { client } from '../config/clients/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { AuthRequest } from '../utils/types.js';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);


router.get('/products', async (req: Request, res: Response) => {
  try {
    
    const products = await stripe.products.list({
      limit: 10,
      expand: ['data.default_price'], 
    });
     const formattedProducts = products.data.map((product) => {
      const price = product.default_price as Stripe.Price;

      const amount = price?.unit_amount ?? 0;
      const currency = price?.currency?.toUpperCase() ?? 'USD';

      const formattedPrice = `${amount / 100} ${currency}`;

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        features: product.metadata?.marketing_features || null,
        price: formattedPrice,
      };
    });
    res.json({ success: true, data: formattedProducts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router };
