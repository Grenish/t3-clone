import { z } from "zod";

export const createConversationSchema = z.object({
    title: z.string().min(1, "Title is required"),
    initialMessage: z.string().optional().describe("Optional initial message to save with the conversation"),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
