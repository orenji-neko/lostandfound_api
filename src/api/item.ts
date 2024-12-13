import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

import Auth from "../session";

const Item = new Elysia({ prefix: "items" })
  .decorate("prisma", new PrismaClient())
  .use(Auth)
  /**
   * Read list of all items.
   */
  .get("/", async ({ user, prisma }) => {

    // Find list of items
    const items = await prisma.item.findMany();

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
    const { title, description, status, type, image } = body;

    // Ensure the /file directory exists
    await mkdir(path.join(process.cwd(), 'file'), { recursive: true });

    // Generate a unique hashed filename
    const fileExtension = path.extname(image.name);
    const hashedFilename = randomBytes(16).toString('hex') + fileExtension;
    const filePath = path.join(process.cwd(), 'file', hashedFilename);

    // Convert ArrayBuffer to Uint8Array
    const arrayBuffer = await image.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Write the file to the /file directory
    await writeFile(filePath, uint8Array);

    // Create the item in the database with the hashed filename
    const item = await prisma.item.create({
      data: {
        title:        title,
        description:  description,
        status:       status ? status : "Unknown",
        type:         type ? type : "Unknown",
        image:        hashedFilename, // Store the hashed filename
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

    let hashedFilename: string = "";
    if(image) {
      // Ensure the /file directory exists
      await mkdir(path.join(process.cwd(), 'file'), { recursive: true });

      // Generate a unique hashed filename
      const fileExtension = path.extname(image.name);
      hashedFilename = randomBytes(16).toString('hex') + fileExtension;
      const filePath = path.join(process.cwd(), 'file', hashedFilename);

      // Convert ArrayBuffer to Uint8Array
      const arrayBuffer = await image.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Write the file to the /file directory
      await writeFile(filePath, uint8Array);
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
        image:        image ? hashedFilename : tmp.image
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