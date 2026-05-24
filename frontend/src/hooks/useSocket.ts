import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAssignmentStore } from '../store/useAssignmentStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export function useSocket(assignmentId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const updateAssignmentStatus = useAssignmentStore((state) => state.updateAssignmentStatus);
  const fetchAssignmentDetails = useAssignmentStore((state) => state.fetchAssignmentDetails);

  useEffect(() => {
    if (!assignmentId) return;

    console.log(`Connecting socket for assignment: ${assignmentId}`);
    
    // Create socket client
    const socket = io(API_BASE);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket client connected to backend');
      // Join the assignment room
      socket.emit('join-assignment', assignmentId);
    });

    // Listen for status updates
    socket.on('status-update', (data: { status: 'pending' | 'generating' | 'completed' | 'failed'; step: string }) => {
      console.log('Socket status update received:', data);
      
      // Update global Zustand store status
      updateAssignmentStatus(assignmentId, data.status, data.step);

      // If finished, refresh details to fetch sections/questions
      if (data.status === 'completed' || data.status === 'failed') {
        fetchAssignmentDetails(assignmentId);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket client disconnected from backend');
    });

    // Clean up connection
    return () => {
      console.log(`Disconnecting socket for assignment: ${assignmentId}`);
      socket.disconnect();
    };
  }, [assignmentId, updateAssignmentStatus, fetchAssignmentDetails]);

  return socketRef.current;
}
