import { api } from "./api";

// ============================================================
// TYPES
// ============================================================

export interface SupportMessage {
  id: number;
  userId: string;
  fromAdmin: boolean;
  text: string;
  createdAt: string;
  readAt: string | null;
  resolvedAt: string | null;
}

export interface ConversationSummary {
  userId: string;
  userName: string | null;
  userEmail: string;
  userRole: string;
  lastMessageAt: string;
  lastMessageText: string;
  unreadCount: number;
  resolvedAt: string | null;
}

// ============================================================
// API — chat de suporte (Fale Conosco) v1.0
// ============================================================

export const supportService = {
  // USER
  async getMyMessages(): Promise<SupportMessage[]> {
    const res = await api.get<SupportMessage[]>("/api/support/my-messages");
    return res.data;
  },
  async sendMyMessage(text: string): Promise<SupportMessage> {
    const res = await api.post<SupportMessage>("/api/support/my-messages", { text });
    return res.data;
  },
  async markMyAsRead(): Promise<void> {
    await api.post("/api/support/my-messages/mark-read");
  },
  async getMyUnreadCount(): Promise<number> {
    try {
      const res = await api.get<{ count: number }>("/api/support/my-unread-count");
      return res.data.count ?? 0;
    } catch {
      return 0;
    }
  },

  // ADMIN
  async listConversations(): Promise<ConversationSummary[]> {
    const res = await api.get<ConversationSummary[]>("/api/support/conversations");
    return res.data;
  },
  async getConversation(userId: string): Promise<SupportMessage[]> {
    const res = await api.get<SupportMessage[]>(`/api/support/conversations/${userId}`);
    return res.data;
  },
  async replyToUser(userId: string, text: string): Promise<SupportMessage> {
    const res = await api.post<SupportMessage>(`/api/support/conversations/${userId}`, { text });
    return res.data;
  },
  async markUserAsRead(userId: string): Promise<void> {
    await api.post(`/api/support/conversations/${userId}/mark-read`);
  },
  async resolve(userId: string): Promise<void> {
    await api.post(`/api/support/conversations/${userId}/resolve`);
  },
  async reopen(userId: string): Promise<void> {
    await api.post(`/api/support/conversations/${userId}/reopen`);
  },
  async getAdminUnreadCount(): Promise<number> {
    try {
      const res = await api.get<{ count: number }>("/api/support/admin-unread-count");
      return res.data.count ?? 0;
    } catch {
      return 0;
    }
  },
};
