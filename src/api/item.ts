import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";

import Session from "../plugins/session";
import { saveFile } from "../utils/file";

const Item = new Elysia({ prefix: "items" })
  .decorate("prisma", new PrismaClient())
  .use(Session)
  /**
   * Read list of all items.
   */
  .get("/", async ({ user, prisma }) => {

    // Find list of items
    const items = await prisma.item.findMany({
      include: {
        createdBy: true,
        category: true,
        images: {
          select: {
            filename: true
          }
        }
      }
    });

    return {
      data: items 
    };
    
  })
  /**
   * Read detail of specific item.
   */
  .get("/:id", async ({ params: { id }, prisma }) => {
    
    // Find unique item
    const item = await prisma.item.findUnique({
      where: {
        id: id
      },
      include: {
        category: true,
        createdBy: true
      }
    });

    return {
      data: item
    }

  })
  /**
   * Create item
   */
  .post("/", async ({ body, prisma, user }) => {
    const { title, description, status, type, images, location } = body;

    // Save images to file directory using Promise.all to properly handle async file uploads
    const filenames = await Promise.all(
      images.map(async (img) => await saveFile(img))
    );

    // Create the item in the database with the hashed filename
    const item = await prisma.item.create({
      data: {
        title:        title,
        description:  description,
        status:       status || "Unknown",
        type:         type || "Unknown",
        images: {
          create: filenames.map((filename) => ({ filename: filename }))
        },
        location:     location || "Unknown",
        createdBy: {
          connect: {
            id: user?.id // currently logged in user is made as creator of item
          }
        }
      },
      include: {
        images: true
      }
    });

    return {
      data: item
    }
    
  }, {
    body: t.Object({
      title:        t.String(),
      description:  t.String(),
      status:       t.Optional(t.String()),
      type:         t.Optional(t.String()),
      location:     t.String(),
      images:       t.Files({ type: "image" })
    }),
    protected: true
  })
  /**
   * Update an item.
   */
  .put("/:id", async ({ body, error, params: { id }, prisma, user }) => {
  
    const { title, description, status, type, images } = body;
    
    // Find original item
    const originalItem = await prisma.item.findUnique({
      where: { id: id },
      include: {
        images: true,
        category: true,
      }
    });

    // If item doesn't exist
    if(!originalItem) {
      return error(404, {
        message: "Item not found"
      })
    }

    let newImageFilenames: string[] = [];
    if (images && images.length > 0) {
      // Upload new images and collect their filenames
      newImageFilenames = await Promise.all(
        images.map(async (img) => await saveFile(img))
      );
    }

    // Update item with new data and images
    const updatedItem = await prisma.item.update({
      where: { id: id },
      data: {
        // Update basic fields with new values or keep existing
        title:        title       ? title         : originalItem.title,
        description:  description ? description   : originalItem.description,
        status:       status      ? status        : originalItem.status,
        type:         type        ? type          : originalItem.type,
        
        images: {
          // Disconnect all existing images
          deleteMany: {},
          
          // Create new image records if new images were uploaded
          ...(newImageFilenames.length > 0 ? {
            create: newImageFilenames.map((filename) => ({ 
              filename: filename 
            }))
          } : {})
        }
      },
      // Include images in the return to confirm the update
      include: {
        images: {
          select: {
            filename: true
          }
        }
      }
    });

    return {
      data: updatedItem
    }

  }, {
    body: t.Object({
      title:        t.Optional(t.String()),
      description:  t.Optional(t.String()),
      status:       t.Optional(t.String()),
      type:         t.Optional(t.String()),
      images:       t.Optional(t.Files())
    })
  })
  .delete("/:id", async ({ params: { id }, prisma }) => {

    // delete item
    const usr = await prisma.item.delete({
      where: {
        id: id
      }
    });

    return {
      data: usr
    }
  });

export default Item;