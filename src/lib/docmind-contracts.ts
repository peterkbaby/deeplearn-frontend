import { z } from "zod";

export const documentStatusSchema = z.enum(["processing", "ready", "failed"]);

export const documentSchema = z.object({
  id: z.uuid(),
  owner_id: z.string(),
  filename: z.string(),
  title: z.string(),
  storage_key: z.string(),
  page_count: z.number().int().nonnegative(),
  status: documentStatusSchema,
  created_at: z.string(),
});

export const summarySchema = z.object({
  document_id: z.uuid(),
  summary: z.string(),
  source_pages: z.array(z.number().int()),
});

export const documentListSchema = z.object({
  documents: z.array(documentSchema),
  total: z.number().int().nonnegative(),
});

export const documentUploadSchema = z.object({
  data: documentSchema,
  summary: summarySchema.nullable(),
});

export const chatResponseSchema = z.object({
  answer: z.string(),
  source_pages: z.array(z.number().int()),
  chunks_used: z.number().int().nonnegative(),
});

export type DocmindDocument = z.infer<typeof documentSchema>;
export type DocumentSummary = z.infer<typeof summarySchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;

const uuidPath =
  /^\/docmind\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isDocmindDestination(value: string) {
  return value === "/docmind" || uuidPath.test(value);
}
