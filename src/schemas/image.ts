import { z } from "zod";

export const imagePathSchema = z.string();

export const transformationSchema = z.object({
  width: z.coerce.number().int().min(1).optional(),
  quality: z.coerce.number().int().min(0).max(100).optional(),
  format: z.string().optional(),
});

export type ImagePath = z.infer<typeof imagePathSchema>;
export type Transformation = z.infer<typeof transformationSchema>;
