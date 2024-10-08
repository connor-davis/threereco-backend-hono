import { Hono } from "hono";
import { z } from "zod";
import authMiddleware from "../../utilities/authMiddleware";
import { zValidator } from "@hono/zod-validator";
import db from "../../db";
import { businesses, products } from "../../schemas";
import { and, eq, or } from "drizzle-orm";
import { productSchema } from "../../models/product";
import { Session } from "hono-sessions";

const viewProductsRouter = new Hono<{
  Variables: {
    session: Session;
    session_key_rotation: boolean;
  };
}>();

const QuerySchema = z.object({
  id: z.string().uuid().nullable().optional(),
  includeBusiness: z.coerce.boolean().optional(),
});

viewProductsRouter.get(
  "/",
  async (context, next) =>
    await authMiddleware(
      ["System Admin", "Admin", "Staff", "Business"],
      context,
      next
    ),
  zValidator("query", QuerySchema),
  async (context) => {
    const { id, includeBusiness } = await QuerySchema.parseAsync(
      context.req.query()
    );
    const session = context.get("session");
    const userId = session.get("user_id") as string;
    const userRole = session.get("user_role") as string;
    const isBusinessUser = userRole === "Business";

    if (!id) {
      const productsResult = await db
        .select()
        .from(products)
        .leftJoin(businesses, eq(products.businessId, businesses.id))
        .where(and(isBusinessUser ? eq(businesses.userId, userId) : undefined));

      return context.json(
        [
          ...productsResult.map((result) => ({
            ...result.products,
            business: includeBusiness ? result.businesses : null,
          })),
        ],
        200
      );
    } else {
      const productResult = await db
        .select()
        .from(products)
        .leftJoin(businesses, eq(products.businessId, businesses.id))
        .where(
          and(
            eq(products.id, id),
            isBusinessUser ? eq(businesses.userId, userId) : undefined
          )
        )
        .limit(1);
      const productFound = productResult[0];

      if (!productFound.products) {
        return context.json(
          { error: "Not Found", reason: "Product not found." },
          404
        );
      }

      return context.json(
        {
          ...productSchema.parse({
            ...productFound.products,
            business: includeBusiness ? productFound.businesses : null,
          }),
        },
        200
      );
    }
  }
);

export default viewProductsRouter;
