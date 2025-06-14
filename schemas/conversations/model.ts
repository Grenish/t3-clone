import { z } from "zod";

export const conversationSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    title: z.string().min(1),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

export type Conversation = z.infer<typeof conversationSchema>;
