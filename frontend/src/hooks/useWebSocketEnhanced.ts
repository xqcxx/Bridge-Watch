import { useEffect, useRef, useCallback } from "react";
import { wsService } from "../services/websocket";
import {
  useWebSocketStore,
  selectIsConnected,
  selectActiveChannels,
  type WebSocketState,
  type WebSocketActions,
} from "../stores";

const WS_URL = `ws://${window.location.hostname}:3002/api/v1/ws`;

/**
 * Enhanced WebSocket hook that integrates with the Zustand WebSocket store.
 * Provides connection state management, automatic reconnection tracking,
 * and subscription management.
 */
export function useWebSocket(channel: string, onMessage: (data: unknown) => void) {
  const connectedRef = useRef(false);

  // Connect to WebSocket store for state management
  const isConnected = useWebSocketStore(selectIsConnected);
  const activeChannels = useWebSocketStore(selectActiveChannels);
  const {
    setUrl,
    setStatus,
    markConnected,
    markDisconnected,
    incrementReconnectAttempts,
    subscribe,
    confirmSubscription,
    unsubscribe,
    addMessage,
    addError,
  } = useWebSocketStore();

  useEffect(() => {
    // Initialize WebSocket URL in store
    setUrl(WS_URL);

    if (!connectedRef.current) {
      setStatus("connecting");
      wsService.connect(WS_URL);
      connectedRef.current = true;
    }

    // Subscribe to channel through store
    subscribe(channel);

    const handleOpen = () => {
      markConnected();
      confirmSubscription(channel);
    };

    const unsubscribeConnectionState = wsService.onStateChange((state) => {
      if (state === "connected") {
        handleOpen();
        return;
      }

      if (state === "disconnected") {
        markDisconnected();
        return;
      }

      if (state === "error") {
        addError(1006, "WebSocket connection error");
        incrementReconnectAttempts();
      }
    });

    const unsubscribeChannel = wsService.subscribe(channel, (data) => {
      addMessage(channel, data);
      onMessage(data);
    });

    return () => {
      unsubscribe(channel);
      unsubscribeChannel();
      unsubscribeConnectionState();
    };
  }, [channel, onMessage]);

  const send = useCallback(
    (data: unknown) => {
      if (isConnected) {
        wsService.send(data);
      } else {
        console.warn("WebSocket not connected. Message not sent.", data);
      }
    },
    [isConnected]
  );

  const isSubscribed = activeChannels.includes(channel);

  return {
    send,
    isConnected,
    isSubscribed,
  };
}

/**
 * Hook to access WebSocket connection status and statistics
 */
export function useWebSocketStatus() {
  const status = useWebSocketStore(
    (state: WebSocketState & WebSocketActions) => state.status
  );
  const reconnectAttempts = useWebSocketStore(
    (state: WebSocketState & WebSocketActions) => state.reconnectAttempts
  );
  const maxReconnectAttempts = useWebSocketStore(
    (state: WebSocketState & WebSocketActions) => state.maxReconnectAttempts
  );
  const lastError = useWebSocketStore(
    (state: WebSocketState & WebSocketActions) => state.lastError
  );
  const messageCount = useWebSocketStore(
    (state: WebSocketState & WebSocketActions) => state.messageCount
  );

  return {
    status,
    isConnected: status === "connected",
    isConnecting: status === "connecting",
    isReconnecting: status === "reconnecting",
    reconnectAttempts,
    maxReconnectAttempts,
    lastError,
    messageCount,
  };
}
