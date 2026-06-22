import { z } from "zod";

export const imagePathSchema = z.string();

export const transformationSchema = z.object({
  w: z.int().min(1),
  format: z.string(),
});

export type ImagePath = z.infer<typeof imagePathSchema>;
export type Transformation = z.infer<typeof transformationSchema>;
