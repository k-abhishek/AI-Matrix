import { useEffect, useRef, useCallback } from 'react';

type MessageHandler<T> = (data: T) => void;

export function useBroadcastChannel<T>(
  channelName: string,
  onMessage?: MessageHandler<T>
) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onMessageRef = useRef<MessageHandler<T> | undefined>(onMessage);

  // Keep the latest callback ref updated without triggering channel reconnection
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    // SSR / Browser support check
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      return;
    }

    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    const handleMessage = (event: MessageEvent<T>) => {
      onMessageRef.current?.(event.data);
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
      channelRef.current = null;
    };
  }, [channelName]);

  const postMessage = useCallback((message: T) => {
    channelRef.current?.postMessage(message);
  }, []);

  return { postMessage };
}