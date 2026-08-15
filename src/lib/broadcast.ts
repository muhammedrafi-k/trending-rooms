import { ChatMessage, TrendingRoom, FeedPost } from '../types';

export type BroadcastPayload =
  | { type: 'NEW_MESSAGE'; message: ChatMessage }
  | { type: 'DELETE_MESSAGE'; roomId: string; messageId: string }
  | { type: 'POLL_VOTE'; roomId: string; messageId: string; optionId: string }
  | { type: 'REACTION'; roomId: string; messageId: string; emoji: string }
  | { type: 'FLOATING_EMOJI'; roomId: string; emoji: string }
  | { type: 'NEW_ROOM'; room: TrendingRoom }
  | { type: 'ROOM_UPDATED'; room: TrendingRoom }
  | { type: 'DELETE_ROOM'; roomId: string }
  | { type: 'NEW_POST'; post: FeedPost }
  | { type: 'DELETE_POST'; postId: string }
  | { type: 'PRESENCE_UPDATE'; roomId: string; delta: number };

const CHANNEL_NAME = 'trending_rooms_live_channel';

class RealtimeBroadcastEngine {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(payload: BroadcastPayload) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        this.listeners.forEach((listener) => listener(event.data));
      };
    }
  }

  public subscribe(callback: (payload: BroadcastPayload) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  public broadcast(payload: BroadcastPayload) {
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }
  }
}

export const broadcastEngine = new RealtimeBroadcastEngine();
