import {
  AccessToken,
  RoomServiceClient,
  type VideoGrant,
} from "livekit-server-sdk";
import { env } from "../env.js";

export const roomService = new RoomServiceClient(
  env.LIVEKIT_URL,
  env.LIVEKIT_API_KEY,
  env.LIVEKIT_API_SECRET,
);

export interface VideoTokenOptions {
  roomName: string;
  participantIdentity: string; // userId
  participantName: string; // displayName
  canPublish?: boolean;
  canSubscribe?: boolean;
}

export async function createVideoToken(
  options: VideoTokenOptions,
): Promise<string> {
  const { roomName, participantIdentity, participantName } = options;

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: options.canPublish ?? true,
    canSubscribe: options.canSubscribe ?? true,
    canPublishData: true,
  };

  const token = new AccessToken(
    env.LIVEKIT_API_KEY,
    env.LIVEKIT_API_SECRET,
    {
      identity: participantIdentity,
      name: participantName,
      ttl: "2h",
    },
  );
  token.addGrant(grant);

  return token.toJwt();
}

export async function createRoom(roomName: string): Promise<void> {
  await roomService.createRoom({
    name: roomName,
    emptyTimeout: 300, // close after 5min empty
    maxParticipants: 2,
  });
}

export async function deleteRoom(roomName: string): Promise<void> {
  await roomService.deleteRoom(roomName);
}
