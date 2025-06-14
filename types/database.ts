export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system' | 'tool';
          content: string;
          model_used: string | null;
          token_usage: number | null;
          response_time_ms: number | null;
          status: 'pending' | 'completed' | 'failed' | 'cancelled';
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system' | 'tool';
          content: string;
          model_used?: string | null;
          token_usage?: number | null;
          response_time_ms?: number | null;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant' | 'system' | 'tool';
          content?: string;
          model_used?: string | null;
          token_usage?: number | null;
          response_time_ms?: number | null;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          created_at?: string;
        };
      };
    };
  };
}