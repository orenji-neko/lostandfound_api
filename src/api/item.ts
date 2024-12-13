import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";

import Auth from "../session";

const Item = new Elysia({ prefix: "items" })
  .decorate("prisma", new PrismaClient())
  .use(Auth)
  /**
   * Read list of all items.
   */
  .get("/", async ({ user, prisma }) => {
    
    const items = await prisma.item.findMany();

    return {
      data: items 
    };
    
  })
  /**
   * Read detail of specific item.
   */
  .get("/:id", async ({ params: { id }, prisma }) => {
    
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

    const { title, description, status, type } = body;

    const item = await prisma.item.create({
      data: {
        title:        title,
        description:  description,
        status:       status ? status : "Unknown",
        type:         type ? type : "Unknown",
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
      images:       t.File({ type: "image/*" })
    }),
    protected: true
  })
  /**
   * Update an item.
   */
  .put("/:id", async ({ body, error, params: { id }, prisma, user }) => {
  
    const { title, description, status, type } = body;
    
    const tmp = await prisma.item.findUnique({
      where: {
        id: id
      }
    });

    if(!tmp) {
      return error(404, {
        message: "User not found"
      })
    }

    const usr = await prisma.item.update({
      where: {
        id: id
      },
      data: {
        title:        title ? title : tmp.title,
        description:  description ? description : tmp.description,
        status:       status ? status : tmp.status,
        type:         type ? type : tmp.type
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
      type:         t.Optional(t.String())
    })
  })
  .delete("/:id", async ({ params: { id }, prisma }) => {

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