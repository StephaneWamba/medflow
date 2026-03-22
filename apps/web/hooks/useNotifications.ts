"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useNotificationStore } from "@/stores/notification.store";
import { useAuthStore } from "@/stores/auth.store";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
}

export function useNotifications(page = 1) {
  const { token } = useAuthStore();
  const { setUnreadCount } = useNotificationStore();
  const queryClient = useQueryClient();

  const query = useQuery<NotificationsResponse>({
    queryKey: ["notifications", page],
    queryFn: () =>
      api.get<NotificationsResponse>(`/notifications?page=${page}&limit=20`),
    enabled: !!token,
  });

  // Count unread
  const unreadQuery = useQuery<NotificationsResponse>({
    queryKey: ["notifications-unread"],
    queryFn: () =>
      api.get<NotificationsResponse>("/notifications?unreadOnly=true&limit=1"),
    enabled: !!token,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (unreadQuery.data) {
      setUnreadCount(unreadQuery.data.total);
    }
  }, [unreadQuery.data, setUnreadCount]);

  // Real-time: listen for new notifications via Socket.io
  useEffect(() => {
    if (!token) return;
    const socket = getSocket();

    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    };

    socket.on("notification:new", handler);
    return () => { socket.off("notification:new", handler); };
  }, [token, queryClient]);

  return query;
}
