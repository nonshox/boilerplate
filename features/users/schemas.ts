import { z } from "zod";

export const updateUserNameSchema = z
  .object({
    name: z.string().trim().max(50),
  })
  .strict();
