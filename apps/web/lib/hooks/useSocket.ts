'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket || !socket.connected) {
    socket = io(`${WS_URL}/events`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = getSocket();
    return () => {
      // Don't disconnect — socket is shared across components
    };
  }, []);

  return socketRef;
}

export function joinTournamentRoom(tournamentId: string) {
  getSocket().emit('join:tournament', { tournamentId });
}

export function joinAreaRoom(areaId: string) {
  getSocket().emit('join:area', { areaId });
}

export function onCombatUpdated(handler: (combat: any) => void) {
  const s = getSocket();
  s.on('combat:updated', handler);
  return () => { s.off('combat:updated', handler); };
}

export function onCheckinUpdated(handler: (checkin: any) => void) {
  const s = getSocket();
  s.on('checkin:updated', handler);
  return () => { s.off('checkin:updated', handler); };
}

export function onScheduleUpdated(handler: (updates: Array<{ id: string; scheduledTime: string | null; areaId: string | null }>) => void) {
  const s = getSocket();
  s.on('schedule:updated', handler);
  return () => { s.off('schedule:updated', handler); };
}
