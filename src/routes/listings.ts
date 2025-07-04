import { Request, Response, Router } from "express";
import { client } from "../config/clients/index.js";
import { authenticateToken } from "../middleware/auth.js";
import { AuthRequest } from "../utils/types.js";

const router = Router();

router.get("/categories", authenticateToken, async (req, res) => {
  try {
    const categories = await client.listing_categories.findMany();
    res.status(200).send({
      data: categories,
      error: null,
    });
    return
  } catch (error) {
    res.status(500).send({
      data: null,
      error: "Internal Server Error",
    });
  }
});

router.post(
  "/create-listing",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ data: null, error: "Unauthorized User" });
      return;
    }
    try {
      const {
        company_name,
        category,
        address,
        telephone,
        email,
        website_url,
        description,
      } = req.body;

      if (!company_name || !category || !address || !description) {
        res.status(400).send({
          data: null,
          error: "Missing required values",
        });
        return;
      }

      const newListing = await client.listings.create({
        data: {
          created_by: userId,
          company_name,
          category,
          address,
          description,
          telephone,
          email,
          website_url,
        },
      });
      res.status(200).send({
        data: "New listing created",
        error: null,
      });
      return;
    } catch (error) {
      console.error("Error creating a new listing:", error);
      res.status(500).send({
        data: null,
        error: "Internal Server Error",
      });
    }
  }
);

router.get(
  "/all-listings",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ data: null, error: "Unauthorized User" });
      return;
    }
    try {
      const listings = await client.listings.findMany({
        where: {
          created_by: userId,
        },
      });

      res.status(200).send({
        data: listings,
        error: null,
      });
      return
    } catch (error) {
      console.error("Error fetching all listings :", error);
      res.status(500).send({
        data: null,
        error: "Internal Server Error",
      });
    }
  }
);
export { router };
