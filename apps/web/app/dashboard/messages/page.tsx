"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth.store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ConvLastMessage { encryptedContent: string; createdAt: string; senderId: string; }
interface Conversation {
  id: string;
  appointmentId: string;
  appointment: {
    doctor: { firstName: string; lastName: string };
    patient: { firstName: string; lastName: string };
  };
  messages: ConvLastMessage[];
  _count: { messages: number };
}
interface Message { id: string; encryptedContent: string; senderId: string; createdAt: string; }

function msgDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

function getConversationName(conv: Conversation, role: string | undefined) {
  if (role === "DOCTOR") return `${conv.appointment.patient.firstName} ${conv.appointment.patient.lastName}`;
  return `Dr. ${conv.appointment.doctor.firstName} ${conv.appointment.doctor.lastName}`;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: convData } = useQuery<{ conversations: Conversation[] }>({
    queryKey: ["conversations"],
    queryFn: () => api.get("/messages/conversations"),
  });

  const { data: msgData, isLoading: msgsLoading } = useQuery<{ messages: Message[] }>({
    queryKey: ["messages", activeConvId],
    queryFn: () => api.get(`/messages/${activeConvId}?limit=50`),
    enabled: !!activeConvId,
    refetchInterval: false,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => api.post(`/messages/${activeConvId}`, { encryptedContent: content, iv: "none" }),
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", activeConvId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Real-time
  useEffect(() => {
    const socket = getSocket();
    const handler = (data: { conversationId: string }) => {
      if (data.conversationId === activeConvId) {
        queryClient.invalidateQueries({ queryKey: ["messages", activeConvId] });
      }
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };
    socket.on("message:new", handler);
    return () => { socket.off("message:new", handler); };
  }, [activeConvId, queryClient]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgData]);

  const conversations = convData?.conversations ?? [];
  const messages = msgData?.messages ?? [];
  const activeConv = conversations.find((c) => c.id === activeConvId);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvId) return;
    sendMutation.mutate(newMessage.trim());
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-[var(--color-fg)] mb-6">Messages</h1>

      <div className="flex h-[calc(100dvh-12rem)] bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        {/* Conversation list */}
        <div className="flex w-72 shrink-0 flex-col border-r border-[var(--color-border)]">
          <div className="p-3 border-b border-[var(--color-border)]">
            <Input placeholder="Search conversations…" className="h-8 text-xs" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <MessageSquare className="h-8 w-8 text-[var(--color-fg-subtle)] mb-2" />
                <p className="text-sm text-[var(--color-fg-muted)]">No conversations yet</p>
                <p className="text-xs text-[var(--color-fg-subtle)] mt-1">Messages appear after a confirmed appointment</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const name = getConversationName(conv, user?.role);
                const lastMsg = conv.messages[0];
                const isActive = conv.id === activeConvId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 text-left transition-colors border-b border-[var(--color-border)] last:border-0",
                      isActive ? "bg-[var(--color-brand-50)]" : "hover:bg-[var(--color-surface-2)]",
                    )}
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={cn("text-sm font-medium truncate", isActive ? "text-[var(--color-brand-800)]" : "text-[var(--color-fg)]")}>{name}</span>
                        {lastMsg && <span className="text-xs text-[var(--color-fg-subtle)] shrink-0 ml-1">{msgDateLabel(lastMsg.createdAt)}</span>}
                      </div>
                      {lastMsg && (
                        <p className="text-xs text-[var(--color-fg-subtle)] truncate mt-0.5">{lastMsg.encryptedContent}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        {activeConvId && activeConv ? (
          <div className="flex flex-1 flex-col">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(getConversationName(activeConv, user?.role))}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-[var(--color-fg)]">{getConversationName(activeConv, user?.role)}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {msgsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--color-fg-subtle)]" />
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex", isMe ? "justify-end" : "justify-start")}
                    >
                      <div className={cn(
                        "max-w-[70%] rounded-[var(--radius-xl)] px-3.5 py-2 text-sm",
                        isMe
                          ? "bg-[var(--color-brand-600)] text-white rounded-br-[var(--radius-sm)]"
                          : "bg-[var(--color-surface-2)] text-[var(--color-fg)] border border-[var(--color-border)] rounded-bl-[var(--radius-sm)]"
                      )}>
                        <p className="leading-relaxed">{msg.encryptedContent}</p>
                        <p className={cn("text-[10px] mt-1", isMe ? "text-white/60" : "text-[var(--color-fg-subtle)]")}>
                          {format(new Date(msg.createdAt), "h:mm a")}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-[var(--color-border)]">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message…"
                className="h-9 flex-1"
                disabled={sendMutation.isPending}
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMutation.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-center">
            <div>
              <MessageSquare className="h-10 w-10 text-[var(--color-fg-subtle)] mx-auto mb-3" />
              <p className="text-sm font-medium text-[var(--color-fg)]">Select a conversation</p>
              <p className="text-xs text-[var(--color-fg-muted)] mt-1">Choose from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
