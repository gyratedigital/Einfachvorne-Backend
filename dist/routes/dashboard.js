// import { Request, Response, Router } from "express";
// import { client } from "../config/clients/index.js";
// import bcrypt from 'bcrypt'
// import jwt from 'jsonwebtoken'
// import { Slugify } from "../utils/index.js";
export {};
// const router = Router();
//  export async function getRegionSlugs(regionId: string) {
//   let slug1: string | null = null;
//   let slug2: string | null = null;
//   let slug3: string | null = null;
//   const region1 = await client.fbl_regions.findFirst({
//     where: { id: regionId },
//     select: { slug: true, parent_id: true },
//   });
//   if (region1) {
//     slug3 = region1.slug;
//     if (region1.parent_id) {
//       const region2 = await client.fbl_regions.findFirst({
//         where: { id: region1.parent_id },
//         select: { slug: true, parent_id: true },
//       });
//       if (region2) {
//         slug2 = region2.slug;
//         if (region2.parent_id) {
//           const region3 = await client.fbl_regions.findFirst({
//             where: { id: region2.parent_id },
//             select: { slug: true },
//           });
//           if (region3) {
//             slug1 = region3.slug;
//           }
//         }
//       }
//     }
//   }
//   return { slug1, slug2, slug3 };
// }
// export const formatDestinations = async (destinations: any[]) => {
//   return await Promise.all(
//     destinations.map(async (destination: any) => {
//       const { slug1, slug2, slug3 } = await getRegionSlugs(destination.region_id);
//       return {
//         id: destination.id,
//         title: destination.title,
//         affiliate_link: destination.destination_url,
//         short_desc: destination.short_description,
//         slug: destination.slug,
//         slug1,
//         slug2,
//         slug3,
//         email: destination.email,
//         telephone: destination.telephone,
//         address: destination.address,
//         google_map_url: destination.google_map_url,
//         rating: destination.rating,
//       };
//     })
//   );
// };
// router.post("/create-region", async (req: Request, res: Response) => {
//   try {
//     const { title, description, region_id } = req.body;
//     if (!title || !description) {
//       res.status(402).send({ data: null, error: "Missing values" });
//       return
//     }
//     let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
//     let existingSlug = await client.fbl_regions.findFirst({
//       where: { slug: slug },
//     });
//     let counter = 1;
//     const originalSlug = slug;
//     while (existingSlug) {
//       slug = `${originalSlug}-${counter}`;
//       existingSlug = await client.fbl_regions.findFirst({
//         where: { slug: slug },
//       });
//       counter++;
//     }
//     const newRegion = await client.fbl_regions.create({
//       data: {
//         title: title,
//         description: description,
//         parent_id: region_id,
//         slug: slug,
//       },
//     });
//     res.status(200).send({ data: "Region created successfully", error: null });
//   } catch (error) {
//     res.status(500).send({ data: null, error: "Internal Server Error" });
//   }
// });
// router.post("/create-destination", async (req: Request, res: Response) => {
//   try {
//     const { title, short_desc, fee, opening_hours, region_id, sub_category_ids, fee_description, destination_url, opening_hours_description, google_map_url, address, youtube_video_url, telephone } = req.body;
//     if (!title || !short_desc || !fee || !region_id || !opening_hours || !sub_category_ids || !fee_description || !destination_url || !opening_hours_description || !google_map_url || !address ) {
//       res.status(402).send({ data: null, error: "Missing values" });
//       return
//     }
//     let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
//     let existingSlug = await client.fbl_destinations.findFirst({
//       where: { slug: slug },
//     });
//     let counter = 1;
//     const originalSlug = slug;
//     while (existingSlug) {
//       slug = `${originalSlug}-${counter}`;
//       existingSlug = await client.fbl_destinations.findFirst({
//         where: { slug: slug },
//       });
//       counter++;
//     }
//     const newDestination = await client.fbl_destinations.create({
//       data: {
//         title: title,
//         slug: slug,
//         region_id: region_id,
//         short_description: short_desc,
//         youtube_video_url: youtube_video_url,
//         telephone: telephone,
//         address: address,
//         google_map_url: google_map_url,
//         destination_url: destination_url,
//         fbl_destination_categories: {
//           create: sub_category_ids.map((id: string) => ({
//             category_id: id,
//           })),
//         },
//       },
//     });
//     if (newDestination) {
//       client.fbl_destination_meta_keys.createMany({
//         data: [
//           {
//             destination_id: newDestination.id,
//             meta_key: "fbl_metakey_fee_description",
//             meta_value: fee_description
//           },
//           {
//             destination_id: newDestination.id,
//             meta_key: "fbl_metakey_opening_hours_description",
//             meta_value: opening_hours_description
//           }
//         ]
//       })
//     }
//     res.status(200).send({ data: "Destination created successfully", error: null });
//   } catch (error) {
//     res.status(500).send({ data: null, error: "Internal Server Error" });
//   }
// });
// router.post("/destinations", async (req: Request, res: Response) => {
//   try {
//     const { size, page } = req.body
//     if (!size || !page) {
//       res.status(402).send({ data: null, error: "Missing values" })
//     }
//     const destinations = await client.fbl_destinations.findMany({
//       take: size,
//       skip: (page - 1) * size,
//       include: {
//         fbl_regions: true,
//         fbl_destination_categories: {
//           select: {
//             fbl_categories: true
//           }
//         }
//       },
//       orderBy: { created_at: "asc" }
//     })
//     if (destinations.length > 0) {
//       const formattedDestinations = await Promise.all(
//         destinations.map(async (destination: any) => {
//           let slug1: string | null = null;
//           let slug2: string | null = null;
//           let slug3: string | null = null;
//           const region1 = await client.fbl_regions.findFirst({
//             where: { id: destination.region_id },
//             select: { slug: true, parent_id: true },
//           });
//           if (region1) {
//             slug3 = region1.slug;
//             if(region1.parent_id){
//               const region2 = await client.fbl_regions.findFirst({
//                 where: { id: region1.parent_id },
//                 select: { slug: true, parent_id: true },
//               });
//               if (region2) {
//                 slug2 = region2.slug;
//                 if(region2.parent_id){
//                   const region3 = await client.fbl_regions.findFirst({
//                     where: { id: region2.parent_id },
//                     select: { slug: true },
//                   });
//                   if (region3) {
//                     slug1 = region3.slug;
//                   }
//                 }
//               }
//             }
//           }
//           return {
//             id: destination.id,
//             title: destination.title,
//             region: destination.fbl_regions.title,
//             affiliate_link: destination.destination_url,
//             short_desc: destination.short_description,
//             slug: destination.slug,
//             slug1,
//             slug2,
//             slug3,
//             email: destination.email,
//             telephone: destination.telephone,
//             address: destination.address,
//             google_map_url: destination.google_map_url,
//           categories: destination.fbl_destination_categories.map((category:any) => {
//             return {
//               name: category.fbl_categories.name
//             }
//           })
//         }
//       }))
//       res.status(200).send({ data: formattedDestinations, error: null })
//     }
//     res.status(402).send({ data: null, error: "No Destinations found" })
//   } catch (error) {
//     res.status(500).send({ data: null, error: "Internal Server Error" });
//   }
// })
// router.get('/categories', async (req: Request, res: Response) => {
//   console.log("GET: /categories")
//   try {
//     const nodes = await client.fbl_categories.findMany({
//       orderBy: { created_at: "asc" }
//     });
//     res.status(200).send({ data: nodes, error: null });
//     return
//   } catch (error) {
//     console.error("Error fetching nodes:", error);
//     res.status(500).send({ data: null, error: "Failed to fetch category nodes." });
//     return
//   }
// })
// router.get('/sub-categories', async (req, res) => {
//   try {
//     const { parent_id } = req.query;
//     if (typeof parent_id !== 'string') {
//       res.status(400).send({ data: null, error: 'Invalid parent ID' });
//       return
//     }
//     const subCategories = await client.fbl_categories.findMany({
//       where: { parent_id: parent_id },
//     });
//     res.status(200).send({ data: subCategories, error: null });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ data: null, error: 'Failed to fetch sub-categories' });
//   }
// }
// );
// router.post("/create-category", async (req: Request, res: Response) => {
//   try {
//     const { name,  parent_id } = req.body;
//     if (!name || !parent_id) {
//       res.status(400).send({ data: null, error: "Name is required." });
//       return
//     }
//       const parentNode = await client.fbl_categories.findUnique({
//         where: { id: parent_id },
//       });
//       if (!parentNode) {
//         res.status(404).send({ data: null, error: "Parent category not found." });
//         return
//       }
//       let slug = Slugify(name)
//     let existingSlug = await client.fbl_destinations.findFirst({
//       where: { slug: slug },
//     });
//     let counter = 1;
//     const originalSlug = slug;
//     while (existingSlug) {
//       slug = `${originalSlug}-${counter}`;
//       existingSlug = await client.fbl_destinations.findFirst({
//         where: { slug: slug },
//       });
//       counter++;
//     }
//       const newNode = await client.fbl_categories.create({
//         data: {
//           name,
//           parent_id,
//           slug:slug
//         },
//       });
//       res.status(200).send({ data: `Added new ${parentNode.name} `, error: null });
//   return
//   } catch (error) {
//     console.error("Error creating category node:", error);
//     res.status(500).send({ data: null, error: "Internal server error." });
//   }
// });
// router.post('/get-region-or-destination', async (req, res) => {
//   try {
//     const { slug } = req.body;
//     if (!slug) {
//       res.status(402).send({ data: null, error: "Missing values" })
//       return
//     }
//     const region = await client.fbl_regions.findFirst({
//       where: { slug: { equals: slug, mode: "insensitive" } },
//       include: { 
//         fbl_regions:true
//        }
//     });
//     if (region) {
//       const totalDestinations = await client.fbl_destinations.count({
//         where: { region_id: region.id },
//       });
//       const destinations = await client.fbl_destinations.findMany({
//         where: { region_id: region.id },
//         skip: (1 - 1) * 6,
//         take: 6,
//         orderBy: { created_at: "asc" },
//       });
//       const topRatedDestinations = await client.fbl_destinations.findMany({
//         where: { region_id: region.id },
//         orderBy: { rating: 'desc' }, 
//         take: 6, 
//       });
//       const freeDestinations = await client.fbl_destinations.findMany({
//         where: {
//           region_id: region.id,
//           fbl_destination_categories: {
//             some: {
//               fbl_categories: {
//                 slug: {
//                   equals: 'kostenlos',
//                   mode: "insensitive",
//                 },
//               },
//             },
//           },
//         },
//         take: 6,
//       })
//       const formattedData = {
//         id: region.id,
//         title: region.title,
//         isRegion: true,
//         description: region.description,
//         total_destinations: totalDestinations,
//         slug: region.slug,
//         totalDestinations:totalDestinations,
//         destinationsData: await formatDestinations(destinations),
//         top_rated_destinations: await formatDestinations(topRatedDestinations),
//         free_destinations: await formatDestinations(freeDestinations),
//         sub_regions: region?.fbl_regions
//       }
//       res.status(200).send({ data: formattedData,  error: null })
//       return
//     } else {
//       const destination = await client.fbl_destinations.findFirst({
//         where: { slug: { equals: slug, mode: "insensitive" } },
//         include: {
//           fbl_regions: {
//             include: {
//               fbl_destinations: true
//             }
//           },
//           fbl_destination_meta_keys:true,
//           fbl_ratings:true,
//           fbl_destination_categories: {
//             include: {
//               fbl_categories: true
//             }
//           }
//         }
//       });
//       if (destination) {
//         const similarDestinations = destination.fbl_regions.fbl_destinations.filter(
//           (similarDestination) => similarDestination.id !== destination.id
//         )
//         let slug1: string | null = null;
//         let slug2: string | null = null;
//         let slug3: string | null = null;
//         const region1 = await client.fbl_regions.findFirst({
//           where: { id: destination.fbl_regions.id },
//           select: { slug: true, parent_id: true },
//         });
//         if (region1) {
//           slug3 = region1.slug;
//           if(region1.parent_id){
//             const region2 = await client.fbl_regions.findFirst({
//               where: { id: region1.parent_id },
//               select: { slug: true, parent_id: true },
//             });
//             if (region2) {
//               slug2 = region2.slug;
//               if(region2.parent_id){
//                 const region3 = await client.fbl_regions.findFirst({
//                   where: { id: region2.parent_id },
//                   select: { slug: true },
//                 });
//                 if (region3) {
//                   slug1 = region3.slug;
//                 }
//               }
//             }
//           }
//         }
//         const slicedSimilarExperiences = similarDestinations.slice(0,4)
//         const similarExperiencesWithSlug = slicedSimilarExperiences.map((destination)=>
//           {
//          return{
//           id:destination.id,
//           title:destination.title,
//           rating:destination.rating,
//           slug:destination.slug,
//           short_desc:destination.short_description,
//           affiliate_link:destination.destination_url,
//           slug1,
//           slug2, 
//           slug3
//          }
//         })
//         const formattedData: any = {
//           id: destination.id,
//           isRegion: false,
//           slug1,
//           slug2,
//           slug3,
//           title: destination.title,
//           region: destination.fbl_regions.title,
//           similar_experiences:similarExperiencesWithSlug ,
//           rating:destination.rating,
//           rating_count:destination.rating_count,
//           affliliate_link: destination.destination_url,
//           cost_url:destination.cost_url,
//           location_url:destination.location_url,
//           short_desc: destination.short_description,
//           slug: destination.slug,
//           seasonal_opening_text:destination.seasonal_opening_txt,
//           telephone: destination.telephone,
//           address: destination.address,
//           google_map_url: destination.google_map_url,
//           youtube_video_url:destination.youtube_video_url,
//           reviews:destination.fbl_ratings.length > 0 ? destination.fbl_ratings.filter((review:any)=> review.review !== null) : [],
//           meta_keys:destination.fbl_destination_meta_keys,
//           categories: destination.fbl_destination_categories.map((category) => {
//             return {
//               id:category.fbl_categories.id,
//               name: category.fbl_categories.name,
//               parent_id:category.fbl_categories.parent_id,
//               slug:category.fbl_categories.slug
//             };
//           }),
//         };
//         res.status(200).send({ data: formattedData, error: null })
//         return
//       } else {
//         res.status(402).send({ data: null, error: "No Region or Destination found" })
//         return
//       }
//     }
//   } catch (error) {
//     console.log("error----",error,)
//     res.status(500).send({ data: null, error: "Internal Server Error" })
//   }
// })
// router.post('/review-destination', async (req, res) => {
//   try {
//     const { rating, destination_id, review, reviewed_by } = req.body
//     const newRating = await client.fbl_ratings.create({
//       data: {
//         rating: rating,
//         destination_id: destination_id,
//         reviewed_by: reviewed_by,
//         review: review
//       }
//     })
//     if (newRating) {
//       const allRatings = await client.fbl_ratings.findMany({
//         where:{
//           destination_id: destination_id
//         }
//       })
//       const validRatings = allRatings
//     .map(r => r.rating)
//     .filter(rating => rating !== null);
//       const total = validRatings.reduce((sum, r) => sum + r, 0);
//       const average = validRatings.length > 0 ? total / validRatings.length : null;
//       // await client.fbl_destinations.update({
//       //   where:{
//       //     id:destination_id
//       //   },
//       //   data:{
//       //     rating:average,
//       //     rating_count:allRatings.length
//       //   }
//       // })
//       res.status(200).send({ data: "Destination reviewed successfully", error: null })
//       return
//     }
//   } catch (error) {
//     res.status(500).send({ data: null, error: "Internal Server Error" })
//   }
// })
// router.post('/create-account', async (req, res) => {
//   const { email, password, first_name, last_name } = req.body;
//   if (!email || !password || !first_name || !last_name) {
//     res.status(400).send({ data: null, error: 'Missing required fields', user:null });
//     return
//   }
//   try {
//     const existing = await client.dashboard_users.findFirst({
//       where: { email },
//     });
//     if (existing) {
//       res.status(400).send({ data: null, error: 'User already exists', user:null })
//       return
//     }
//     const hashed = await bcrypt.hash(password, 10);
//     const newUser = await client.dashboard_users.create({
//       data: { email, password: hashed, first_name, last_name, role: 'support' },
//     });
//     const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET!, { expiresIn: '3d' });
//     res.status(200).send({ data: token, error: null, user:{
//       first_name: newUser.first_name,
//       email: newUser.email,
//       type: newUser.role,
//     }  });
//     return
//   } catch (error) {
//     console.error('Error creating account:', error);
//     res.status(500).send({ data: null, error: 'Internal Server Error', user:null });
//   }
// })
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     res.status(400).send({ data: null, error: 'Missing required fields', user:null });
//     return
//   }
//   try {
//     const user = await client.dashboard_users.findFirst({ where: { email } });
//     if (!user) {
//       res.status(400).send({ data: null, error: 'Invalid Email or Password', user:null })
//       return
//     }
//     const validPassword = await bcrypt.compare(password, user.password);
//     if (!validPassword) {
//       res.status(400).send({ data: null, error: 'Invalid Email or Password', user:null })
//       return
//     }
//     const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '3d' });
//     res.status(200).send({ data: token, error: null, user:{
//       first_name: user.first_name,
//       email: user.email,
//       type: user.role,
//     } });
//     return
//   } catch (error) {
//     console.error('Error logging in:', error);
//     res.status(500).send({ data: null, error: 'Internal Server Error', user:null });
//     return
//   }
// });
// router.post("/paginated-destinations", async (req: Request, res: Response) => {
//   try {
//     const { size, page, filter, region_id } = req.body
//     if (!size || !page) {
//       res.status(402).send({ data: null, error: "Missing values" })
//       return
//     }
//     let destinations:any = []
//     let totalDestinations = 0
//     if(!filter || filter === "" || filter === 'all'){ 
//       totalDestinations = await client.fbl_destinations.count({
//         where:{
//           region_id:region_id
//         }
//       })
//      destinations = await client.fbl_destinations.findMany({
//       where:{
//        region_id: region_id
//       },
//       take: size,
//       skip: (page - 1) * size,
//       include: {
//         fbl_regions: true,
//         fbl_destination_categories: {
//           select: {
//             fbl_categories: true
//           }
//         }
//       },
//       orderBy: { created_at: "asc" }
//     })} else {
//       totalDestinations = await client.fbl_destinations.count({
//         where: {
//           region_id: region_id,
//           fbl_destination_categories: {
//             some: {
//               fbl_categories: {
//                 slug: {
//                   equals: filter,
//                   mode: "insensitive",
//                 },
//               },
//             },
//           },
//         },
//       });
//         destinations = await client.fbl_destinations.findMany({
//           take: size,
//           skip: (page - 1) * size,
//         where: {
//           region_id: region_id,
//           fbl_destination_categories: {
//             some: {
//               fbl_categories: {
//                 name: {
//                   equals: filter,
//                   mode: "insensitive",
//                 },
//               },
//             },
//           },
//         },
//         include:{
//           fbl_destination_categories:{
//             select:{
//               fbl_categories:true
//             }
//           }
//         }
//       });
//   }
//     if (destinations.length > 0) {
//       const formattedDestinations = await Promise.all(
//         destinations.map(async (destination: any) => {
//           let slug1: string | null = null;
//           let slug2: string | null = null;
//           let slug3: string | null = null;
//           const region1 = await client.fbl_regions.findFirst({
//             where: { id: destination.region_id },
//             select: { slug: true, parent_id: true },
//           });
//           if (region1) {
//             slug3 = region1.slug;
//             if(region1.parent_id){
//               const region2 = await client.fbl_regions.findFirst({
//                 where: { id: region1.parent_id },
//                 select: { slug: true, parent_id: true },
//               });
//               if (region2) {
//                 slug2 = region2.slug;
//                 if(region2.parent_id){
//                   const region3 = await client.fbl_regions.findFirst({
//                     where: { id: region2.parent_id },
//                     select: { slug: true },
//                   });
//                   if (region3) {
//                     slug1 = region3.slug;
//                   }
//                 }
//               }
//             }
//           }
//           return {
//             id: destination.id,
//             title: destination.title,
//             rating:destination.rating,
//             affiliate_link: destination.destination_url,
//             short_desc: destination.short_description,
//             slug: destination.slug,
//             slug1,
//             slug2,
//             slug3,
//             email: destination.email,
//             telephone: destination.telephone,
//             address: destination.address,
//             google_map_url: destination.google_map_url,
//         }
//       }))
//       res.status(200).send({ data: formattedDestinations, totalDestinations:totalDestinations, error: null })
//       return
//     }
//     res.status(402).send({ data: null, error: "No Destinations found" })
//     return
//   } catch (error) {
//     console.error("Error fetching destinations:", error);
//     res.status(500).send({ data: null, error: "Internal Server Error" });
//     return
//   }
// })
// router.post("/favorite-destinations", async (req: Request, res: Response) => {
// try {
//   const {slugs} = req.body
//   if(!slugs || slugs.length == 0){
//     res.status(400).send({data:null, error:'No favorite destinations found'})
//     return
//   }
//   const favoriteDestinations = await client.fbl_destinations.findMany({
//     where:{
//       slug:{
//         in:slugs
//       }
//     }
//   })
//   if(favoriteDestinations.length > 0){
//     const formattedDestinations = await Promise.all(
//       favoriteDestinations.map(async (destination: any) => {
//         let slug1: string | null = null;
//         let slug2: string | null = null;
//         let slug3: string | null = null;
//         const region1 = await client.fbl_regions.findFirst({
//           where: { id: destination.region_id },
//           select: { slug: true, parent_id: true },
//         });
//         if (region1) {
//           slug3 = region1.slug;
//           if(region1.parent_id){
//             const region2 = await client.fbl_regions.findFirst({
//               where: { id: region1.parent_id },
//               select: { slug: true, parent_id: true },
//             });
//             if (region2) {
//               slug2 = region2.slug;
//               if(region2.parent_id){
//                 const region3 = await client.fbl_regions.findFirst({
//                   where: { id: region2.parent_id },
//                   select: { slug: true },
//                 });
//                 if (region3) {
//                   slug1 = region3.slug;
//                 }
//               }
//             }
//           }
//         }
//         return {
//           id: destination.id,
//           title: destination.title,
//           affiliate_link: destination.destination_url,
//           short_desc: destination.short_description,
//           slug: destination.slug,
//           slug1,
//           slug2,
//           slug3,
//           email: destination.email,
//           telephone: destination.telephone,
//           address: destination.address,
//           google_map_url: destination.google_map_url,
//     }
//     }))
//     res.status(200).send({data:formattedDestinations, error:null})
//     return
//   }
//   res.status(400).send({data:null, error:"No favorite destinations found"})
//   return
// } catch (error) {
//   res.status(500).send({data:null, error:"Internal Server Error"})
//   return
// }
// })
// router.post("/categorize-destinations", async (req: Request, res: Response) => {
//   try {
//     const {category, search, page} = req.body
//     if(!category){
//       res.status(400).send({data:null, error:'missing taxonomy'})
//       return
//     }
//     const totalCount = await client.fbl_destinations.count({
//       where: {
//         fbl_destination_categories: {
//           some: {
//             fbl_categories: {
//               slug: {
//                 equals: category,
//                 mode: "insensitive",
//               },
//             },
//           },
//         },
//         ...(search &&{
//           title:{
//             contains:search,
//             mode:'insensitive',
//           }
//         })
//       },
//     });
//      const destinations = await client.fbl_destinations.findMany({
//       take: 6,
//       skip: (page - 1) * 6,
//     where: {
//       fbl_destination_categories: {
//         some: {
//           fbl_categories: {
//             slug: {
//               equals: category,
//               mode: "insensitive",
//             },
//           },
//         },
//       },
//       ...(search &&{
//         title:{
//           contains:search,
//           mode:'insensitive',
//         }
//       })
//     },
//   });
//   if(destinations.length > 0 ){
//     const formattedDestinations = await Promise.all(
//       destinations.map(async (destination: any) => {
//         let slug1: string | null = null;
//         let slug2: string | null = null;
//         let slug3: string | null = null;
//         const region1 = await client.fbl_regions.findFirst({
//           where: { id: destination.region_id },
//           select: { slug: true, parent_id: true },
//         });
//         if (region1) {
//           slug3 = region1.slug;
//           if(region1.parent_id){
//             const region2 = await client.fbl_regions.findFirst({
//               where: { id: region1.parent_id },
//               select: { slug: true, parent_id: true },
//             });
//             if (region2) {
//               slug2 = region2.slug;
//               if(region2.parent_id){
//                 const region3 = await client.fbl_regions.findFirst({
//                   where: { id: region2.parent_id },
//                   select: { slug: true },
//                 });
//                 if (region3) {
//                   slug1 = region3.slug;
//                 }
//               }
//             }
//           }
//         }
//         return {
//           id: destination.id,
//           title: destination.title,
//           affiliate_link: destination.destination_url,
//           short_desc: destination.short_description,
//           slug: destination.slug,
//           slug1,
//           slug2,
//           slug3,
//           email: destination.email,
//           telephone: destination.telephone,
//           address: destination.address,
//           google_map_url: destination.google_map_url,
//         };
//       })
//     );
//     res.status(200).send({data:formattedDestinations, totalCount:totalCount, error:null})
//     return
//   }
//   res.status(400).send({data:null, error:'No destinations found'})
//   return
//   } catch (error) {
//     res.status(500).send({data:null, error:'Internal Server Error'})
//   }
// })
// router.post("/get-taxonomy", async (req: Request, res: Response) => {
//   try {
//     const { slug } = req.body;
//     if (!slug) {
//       res.status(400).send({ data: null, error: "Missing values" });
//       return
//     }
//     const taxonomyData = await client.fbl_categories.findFirst({
//       where: {
//         slug: {
//           equals: slug,
//           mode: 'insensitive',
//         }
//       }
//     });
//     if (!taxonomyData) {
//        res.status(404).send({ data: null, error: "No taxonomy found" });
//       return
//     }
//     const level2Categories = await client.fbl_categories.findMany({
//       where: {
//         parent_id: taxonomyData.id
//       }
//     });
//     const level2WithChildren = await Promise.all(
//       level2Categories.map(async (level2) => {
//         const level3Categories = await client.fbl_categories.findMany({
//           where: { parent_id: level2.id }
//         });
//         const level3WithChildren = await Promise.all(
//           level3Categories.map(async (level3) => {
//             const level4Categories = await client.fbl_categories.findMany({
//               where: { parent_id: level3.id }
//             });
//             return {
//               ...level3,
//               childrenCategories: level4Categories
//             };
//           })
//         );
//         return {
//           ...level2,
//           childrenCategories: level3WithChildren
//         };
//       })
//     );
//     const formattedData = {
//       id: taxonomyData.id,
//       name: taxonomyData.name,
//       slug: taxonomyData.slug,
//       parent_id: taxonomyData.parent_id,
//       childrenCategories: level2WithChildren
//     };
//     res.status(200).send({ data: formattedData, error: null });
//     return
//   } catch (error) {
//     console.error("Error in /get-taxonomy:", error);
//     res.status(500).send({ data: null, error: "Internal Server Error" });
//   }
// });
// export { router };
