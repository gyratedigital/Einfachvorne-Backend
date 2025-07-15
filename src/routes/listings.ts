import { Request, Response, Router } from "express";
import { client } from "../config/clients/index.js";
import { authenticateToken } from "../middleware/auth.js";
import { AuthRequest } from "../utils/types.js";
import Stripe from "stripe";
import { formatGermanDate } from "../utils/functions.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const router = Router();

router.get("/categories", authenticateToken, async (req, res) => {
  try {
    const categories = await client.listing_categories.findMany();
    res.status(200).send({
      data: categories,
      error: null,
    });
    return;
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
  async (req: any, res: any) => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ data: null, error: "Unauthorized User" });
      return;
    }
    try {
      const user = await client.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          stripe_customer_id: true,
        },
      });

      if (!user || !user.stripe_customer_id) {
        return res.status(403).json({
          data: null,
          error: "Bitte wähle einen Abonnementplan, um fortzufahren.",
        });
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripe_customer_id,
        status: "all",
        expand: ["data.items.data.price"],
        limit: 1,
      });

      const subscription = subscriptions.data[0];
      if (!subscription || subscription.status !== "active") {
        return res.status(403).json({
          data: null,
          error: "Bitte wähle einen Abonnementplan, um fortzufahren.",
        });
      }
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

      const existingListing = await client.listings.findFirst({
        where: {
          company_name: company_name,
        },
      });
      if (existingListing) {
        res.status(400).send({
          data: null,
          error: "Es existiert bereits ein Unternehmen mit diesem Namen.",
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

router.get("/all-listings", authenticateToken, async (req: any, res: any) => {
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
      include: {
        listing_categories: {
          select: {
            name: true,
          },
        },
      },
    });

    const formattedListings = listings.map((item: any) => ({
      id: item.id,
      company_name: item.company_name,
      address: item.address,
      description: item.description,
      telephone: item.telephone,
      created_at: item.created_at,
      category: item.listing_categories?.name ?? null,
      email: item.email,
      website_url: item.website_url,
    }));

    res.status(200).json({
      data: formattedListings,
      error: null,
    });
    return;
  } catch (error) {
    console.error("Error fetching all listings:", error);
    res.status(500).json({
      data: null,
      error: "Internal Server Error",
    });
  }
});

router.post(
  "/edit-listing",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { company_name, category, description, listing_id } = req.body;
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ data: null, error: "Unauthorized user" });
      return;
    }
    try {
      if (!listing_id) {
        res.status(400).json({ data: null, error: "No listing found to edit" });
        return;
      }
      if (!company_name && !category && !description) {
        res.status(400).json({ data: null, error: "No Changes found" });
        return;
      }
      const listing = await client.listings.findFirst({
        where: {
          id: listing_id,
        },
        select: {
          created_by: true,
          id: true,
        },
      });

      if (listing && listing.created_by !== userId) {
        res.status(400).json({
          data: null,
          error:
            "Sie haben keine Berechtigung, dieses Unternehmen zu bearbeiten",
        });
        return;
      }

      const updateData: Record<string, any> = {};
      if (company_name) updateData.company_name = company_name;
      if (category) updateData.category = category;
      if (description) updateData.description = description;

      await client.listings.update({
        where: {
          id: listing_id,
        },
        data: updateData,
      });
      res
        .status(200)
        .json({ data: "Listing updated successfully", error: null });
      return;
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          `Error updating listing with ID ${listing_id}`,
          error.message
        );
      }
      res.status(500).json({ data: null, error: "Internal Server Error" });
    }
  }
);

router.post("/search-listing", async (req: AuthRequest, res: Response) => {
  const { company_name } = req.body;
  try {
    if (!company_name || company_name === "") {
      res.status(400).json({
        data: null,
        error: "Geben Sie für die Suche einen Firmennamen ein",
      });
      return;
    }
    const listings = await client.listings.findMany({
      where: {
        company_name: {
          contains: company_name,
          mode: "insensitive",
        },
      },
      include: {
        listing_categories: {
          select: {
            name: true,
          },
        },
      },
    });
    if (listings.length == 0) {
      res.status(400).json({ data: null, error: "Kein Eintrag gefunden" });
      return;
    } else {
      const formattedListings = listings.map((item: any) => ({
        id: item.id,
        company_name: item.company_name,
        address: item.address,
        description: item.description,
        telephone: item.telephone,
        created_at: item.created_at,
        category: item.listing_categories?.name ?? null,
        email: item.email,
        website_url: item.website_url,
      }));
      res.status(200).json({ data: formattedListings, error: null });
      return;
    }
  } catch (error) {
    res.status(500).json({ data: null, error: "Internal Server Error" });
    return;
  }
});


router.post(
  "/view-my-listing",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { listing_id } = req.body;

    try {
      const listing = await client.listings.findFirst({
        where: {
          id: listing_id,
          created_by: userId,
        },

        include: {
          listing_categories: {
            select: {
              name: true,
              id: true,
            },
          },
        },
      });
      if (listing) {
        const formattedListing = {
          id: listing.id,
          company_name: listing.company_name,
          address: listing.address,
          description: listing.description,
          telephone: listing.telephone,
          created_at: listing.created_at,
          category: {
            id: listing.listing_categories?.id,
            name: listing.listing_categories?.name,
          },
          email: listing.email,
          website_url: listing.website_url,
        };
        res.status(200).json({
          data: formattedListing,
          error: null,
        });
        return;
      } else {
        res.status(400).json({
          data: null,
          error: "Business not found",
        });
      }
    } catch (error) {
      console.error("Error fetching all listings:", error);
      res.status(500).json({
        data: null,
        error: "Internal Server Error",
      });
    }
  }
);
router.post("/listing-detail", async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { listing_id } = req.body;

  try {
    const listing = await client.listings.findFirst({
      where: {
        id: listing_id,
        created_by: userId,
      },

      include: {
        listing_categories: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });
    if (listing) {
      const formattedListing = {
        id: listing.id,
        company_name: listing.company_name,
        address: listing.address,
        description: listing.description,
        telephone: listing.telephone,
        created_at: listing.created_at,
        category: {
          id: listing.listing_categories?.id,
          name: listing.listing_categories?.name,
        },
        email: listing.email,
        website_url: listing.website_url,
      };
      res.status(200).json({
        data: formattedListing,
        error: null,
      });
      return;
    } else {
      res.status(400).json({
        data: null,
        error: "Business not found",
      });
    }
  } catch (error) {
    console.error("Error fetching all listings:", error);
    res.status(500).json({
      data: null,
      error: "Internal Server Error",
    });
  }
});
router.delete(
  "/delete-listing",
  authenticateToken,
  async (req: any, res: any) => {
    const { listing_id } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ data: null, error: "Unauthorized user" });
    }

    if (!listing_id) {
      return res
        .status(400)
        .json({ data: null, error: "No listing ID provided" });
    }

    try {
      const listing = await client.listings.findFirst({
        where: {
          id: listing_id,
        },
        select: {
          created_by: true,
        },
      });

      if (!listing) {
        return res.status(404).json({ data: null, error: "Listing not found" });
      }

      if (listing.created_by !== userId) {
        return res.status(403).json({
          data: null,
          error: "Sie haben keine Berechtigung, dieses Unternehmen zu löschen",
        });
      }

      await client.listings.delete({
        where: {
          id: listing_id,
        },
      });

      return res
        .status(200)
        .json({ data: "Listing deleted successfully", error: null });
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          `Error deleting listing with ID ${listing_id}:`,
          error.message
        );
      }
      return res
        .status(500)
        .json({ data: null, error: "Internal Server Error" });
    }
  }
);


router.post("/listings", async (req: AuthRequest, res: Response) => {
  const { page, search , categorySlug } = req.body;
  const perPage = 6;

  try {
    const whereClause: any = {};

    if (search.trim() !== "") {
      whereClause.OR = [
        { company_name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        // { address: { contains: search, mode: "insensitive" } },
        // { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categorySlug.trim() !== "") {
      whereClause.listing_categories = {
        slug: categorySlug,
      };
    }

    const totalCount = await client.listings.count({
      where: whereClause,
    });

    const listings = await client.listings.findMany({
      where: whereClause,
      take: perPage,
      skip: (page - 1) * perPage,
      include: {
        listing_categories: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalCount / perPage);

    const formattedListings = listings.map((item: any) => ({
      id: item.id,
      company_name: item.company_name,
      address: item.address,
      description: item.description,
      telephone: item.telephone,
      created_at: item.created_at,
      category: item.listing_categories?.name ?? null,
      email: item.email,
      website_url: item.website_url,
    }));

    res.status(200).json({
      data: formattedListings,
      totalPages,
      currentPage: page,
      error: null,
    });
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({
      data: null,
      error: "Internal Server Error",
    });
  }
});

export { router };
