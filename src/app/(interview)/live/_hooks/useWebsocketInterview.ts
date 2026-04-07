'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * WebSocket Message Types (from Blueprint Part 5)
 */
export type WebSocketMessageType =
  | 'session_ready'
  | 'question_audio'
  | 'transcript_partial'
  | 'transcript_final'
  | 'follow_up'
  | 'answer_scored'
  | 'interview_complete'
  | 'error'
  | 'pong'
  | 'session_paused'
  | 'audio_chunk'
  | 'end_answer'
  | 'end_interview';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface SessionState {
  status: 'INIT' | 'QUESTION_PLAYING' | 'LISTENING' | 'PROCESSING' | 'DONE' | 'ERROR';
  currentQuestionIndex: number;
  totalQuestions: number;
  timeLimit: number;
}

export interface UseWebsocketInterviewReturn {
  // State
  sessionState: SessionState;
  currentQuestion: { text: string; number: number } | null;
  transcript: string;
  currentScore: number | null;
  reconnectToken: string | null;

  // Methods
  connect: (sessionId: string, token: string) => Promise<void>;
  disconnect: () => void;
  sendAudioChunk: (base64Data: string, seq: number) => void;
  endAnswer: () => void;
  endInterview: () => void;
  reconnect: (sessionId: string, token: string) => void;

  // Status
  isConnected: boolean;
  error: string | null;
  isLoading: boolean;
}

/**
 * WebSocket Interview Hook
 *
 * Manages real-time communication with backend for live mock interviews
 *
 * Connection Flow:
 * 1. connect() → establish WebSocket connection with JWT auth
 * 2. Listen for session_ready message
 * 3. Send audio_chunk messages as user records
 * 4. Receive transcript_partial updates in real-time
 * 5. endAnswer() → backend evaluates, sends next question
 * 6. Loop until interview_complete
 * 7. disconnect() → close WebSocket gracefully
 *
 * Error Recovery:
 * - Automatic reconnect with reconnect_token
 * - Session state persisted in Redis (3h TTL)
 * - Max 45 min session, 3 active per user
 */
export function useWebsocketInterview(): UseWebsocketInterviewReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionState, setSessionState] = useState<SessionState>({
    status: 'INIT',
    currentQuestionIndex: 0,
    totalQuestions: 0,
    timeLimit: 120,
  });

  const [currentQuestion, setCurrentQuestion] = useState<{
    text: string;
    number: number;
  } | null>(null);
  const [transcript, setTranscript] = useState('');
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [reconnectToken, setReconnectToken] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<WebSocketMessage[]>([]);

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'session_ready':
          setSessionState((prev) => ({
            ...prev,
            status: 'QUESTION_PLAYING',
            totalQuestions: message.question_count,
            timeLimit: message.time_limit_per_q,
          }));
          break;

        case 'question_audio':
          setCurrentQuestion({
            text: message.question_text,
            number: message.question_num,
          });
          setSessionState((prev) => ({ ...prev, status: 'QUESTION_PLAYING' }));
          // Audio data in message.data (base64 MP3)
          // Parent component will handle playback
          break;

        case 'transcript_partial':
          // Real-time caption as user speaks
          setTranscript(message.text);
          setSessionState((prev) => ({ ...prev, status: 'LISTENING' }));
          break;

        case 'transcript_final':
          // Final transcript after user stops
          setTranscript(message.text);
          setSessionState((prev) => ({ ...prev, status: 'PROCESSING' }));
          // message.duration_s available
          break;

        case 'answer_scored':
          setCurrentScore(message.weighted_score);
          break;

        case 'follow_up':
          // Follow-up question instead of moving to next
          setCurrentQuestion({
            text: message.follow_up_text,
            number: sessionState.currentQuestionIndex + 1,
          });
          setTranscript('');
          setCurrentScore(null);
          break;

        case 'interview_complete':
          // Final report
          setSessionState((prev) => ({ ...prev, status: 'DONE' }));
          // message.report contains full report object
          break;

        case 'session_paused':
          // Disconnection event - save reconnect info
          setReconnectToken(message.reconnect_token);
          break;

        case 'error':
          setError(message.message);
          if (!message.recoverable) {
            setSessionState((prev) => ({ ...prev, status: 'ERROR' }));
          }
          break;

        case 'pong':
          // Server keepalive pong
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
      setError('Failed to process server message');
    }
  }, [sessionState.currentQuestionIndex]);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(
    async (sessionId: string, jwtToken: string) => {
      return new Promise<void>((resolve, reject) => {
        try {
          if (!jwtToken) {
            reject(new Error('Authentication token is required to start interview'));
            return;
          }
          if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_WS_URL) {
            reject(new Error('WebSocket URL is not configured'));
            return;
          }

          setIsLoading(true);
          setError(null);

          const wsUrl = `${
            process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
          }/mock-interview/live/${sessionId}?token=${jwtToken}`;

          const ws = new WebSocket(wsUrl);

          ws.onopen = () => {
            setIsConnected(true);
            setIsLoading(false);
            wsRef.current = ws;

            // Flush any queued messages
            messageQueueRef.current.forEach((msg) => {
              ws.send(JSON.stringify(msg));
            });
            messageQueueRef.current = [];

            // Setup keepalive ping every 30s
            pingIntervalRef.current = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
              }
            }, 30000);

            resolve();
          };

          ws.onmessage = handleMessage;

          ws.onerror = (event) => {
            const errorMsg = 'WebSocket connection error';
            setError(errorMsg);
            setIsLoading(false);
            reject(new Error(errorMsg));
          };

          ws.onclose = () => {
            setIsConnected(false);
            if (pingIntervalRef.current) {
              clearInterval(pingIntervalRef.current);
            }
          };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          const errorMsg = err.message || 'Failed to connect to interview server';
          setError(errorMsg);
          setIsLoading(false);
          reject(new Error(errorMsg));
        }
      });
    },
    [handleMessage]
  );

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User closed connection');
      wsRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    setIsConnected(false);
  }, []);

  /**
   * Send audio chunk to server
   *
   * Format: PCM 16-bit, 16000Hz, mono as base64
   * Rate limit: 50KB/s sustained (blueprint 5.1)
   */
  const sendAudioChunk = useCallback((base64Data: string, seq: number) => {
    const message: WebSocketMessage = {
      type: 'audio_chunk',
      data: base64Data,
      seq,
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      messageQueueRef.current.push(message);
    }
  }, []);

  /**
   * Signal end of answer (silence detected or user clicked stop)
   */
  const endAnswer = useCallback(() => {
    const message: WebSocketMessage = {
      type: 'end_answer',
      session_id: sessionState.currentQuestionIndex.toString(),
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, [sessionState.currentQuestionIndex]);

  /**
   * Signal end of entire interview
   */
  const endInterview = useCallback(() => {
    const message: WebSocketMessage = {
      type: 'end_interview',
      session_id: sessionState.currentQuestionIndex.toString(),
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }

    setTimeout(() => {
      disconnect();
    }, 1000);
  }, [sessionState.currentQuestionIndex, disconnect]);

  /**
   * Reconnect with recovery token after disconnect
   */
  const reconnect = useCallback(
    (sessionId: string, jwtToken: string) => {
      if (!jwtToken) {
        setError('Authentication token is required to reconnect');
        return;
      }
      if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_WS_URL) {
        setError('WebSocket URL is not configured');
        return;
      }
      if (reconnectToken) {
        const wsUrl =
          `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}` +
          `/mock-interview/live/${sessionId}?token=${jwtToken}&reconnect_token=${reconnectToken}`;

        try {
          const ws = new WebSocket(wsUrl);

          ws.onopen = () => {
            setIsConnected(true);
            wsRef.current = ws;
            setReconnectToken(null);
            setError(null);

            // Setup keepalive
            pingIntervalRef.current = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
              }
            }, 30000);
          };

          ws.onmessage = handleMessage;
          ws.onclose = () => setIsConnected(false);
          ws.onerror = (e) => setError('Reconnection failed');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          setError(`Reconnection error: ${err.message}`);
        }
      }
    },
    [reconnectToken, handleMessage]
  );

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    sessionState,
    currentQuestion,
    transcript,
    currentScore,
    reconnectToken,

    // Methods
    connect,
    disconnect,
    sendAudioChunk,
    endAnswer,
    endInterview,
    reconnect,

    // Status
    isConnected,
    error,
    isLoading,
  };
}
