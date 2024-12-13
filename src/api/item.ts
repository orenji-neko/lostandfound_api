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
        category: true
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
   * Create an item.
   */
  .post("/", async ({ body, prisma, user }) => {
    const { title, description, status, type, image, location } = body;

    // Save image to file directory
    const filename = await saveFile(image);

    // Create the item in the database with the hashed filename
    const item = await prisma.item.create({
      data: {
        title:        title,
        description:  description,
        status:       status ? status : "Unknown",
        type:         type ? type : "Unknown",
        image:        filename, // Store the hashed filename
        location:     location ? location : "Unknown",
        createdBy: {
          connect: {
            id:       user?.id // currently logged in user is made as creator of item
          }
        }
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
      image:        t.File()
    }),
    protected: true
  })
  /**
   * Update an item.
   */
  .put("/:id", async ({ body, error, params: { id }, prisma, user }) => {
  
    const { title, description, status, type, image } = body;
    
    // Find original item
    const tmp = await prisma.item.findUnique({
      where: {
        id: id
      }
    });

    // If item doesn't exist
    if(!tmp) {
      return error(404, {
        message: "Item not found"
      })
    }

    let filename: string = "";
    if(image) {
      // Save image to file directory
      filename = await saveFile(image);
    }

    // Update old item
    const usr = await prisma.item.update({
      where: {
        id: id
      },
      data: {
        // replace
        title:        title ? title : tmp.title,
        description:  description ? description : tmp.description,
        status:       status ? status : tmp.status,
        type:         type ? type : tmp.type,
        image:        image ? filename : tmp.image
      }
    });

    return {
      data: usr
    }

  }, {
    body: t.Object({
      title:        t.Optional(t.String()),
      description:  t.Optional(t.String()),
      status:       t.Optional(t.String()),
      type:         t.Optional(t.String()),
      image:        t.Optional(t.File())
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