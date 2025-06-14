import { z } from "zod";

export const messageSchema = z.object({
    id: z.string().uuid(),
    conversation_id: z.string().uuid(),
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1),
    created_at: z.string().datetime(),
});

export type Message = z.infer<typeof messageSchema>;
