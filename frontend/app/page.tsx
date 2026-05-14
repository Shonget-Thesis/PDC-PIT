'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Phone, PhoneOff, Mic, MicOff, SkipForward, Loader2, Send, User, Globe, X } from 'lucide-react';

// WebSocket server URL - use environment variable or fallback to localhost
const WS_BASE_URL = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws').trim().replace(/\/+$/, '');

function getWebSocketUrl(userId: string) {
  if (WS_BASE_URL.endsWith('/ws')) {
    return `${WS_BASE_URL}/${userId}`;
  }

  return `${WS_BASE_URL}/ws/${userId}`;
}

// ICE servers for WebRTC - Enhanced for better stability
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

type ConnectionState = 'disconnected' | 'connecting' | 'waiting' | 'connected';

interface ChatMessage {
  id: string;
  text: string;
  isMine: boolean;
  timestamp: Date;
}

interface UserInfo {
  nickname: string;
  field: string;
  yearLevel: string;
}

const PROGRAM_OPTIONS_MAP: Record<string, { value: string; label: string }[]> = {
  stem: [
    { value: 'BSCS', label: 'BS Computer Science' },
    { value: 'BSIT', label: 'BS Information Technology' },
    { value: 'BSECE', label: 'BS Electronics & Comm. Eng.' },
    { value: 'BSME', label: 'BS Mechanical Eng.' },
    { value: 'BSCE', label: 'BS Civil Eng.' },
    { value: 'BSARCH', label: 'BS Architecture' },
    { value: 'Other', label: 'Other' },
  ],
  humanities: [
    { value: 'BSED', label: 'BS Education' },
    { value: 'Other', label: 'Other' },
  ],
  'social-sciences': [
    { value: 'BSBA', label: 'BS Business Admin.' },
    { value: 'BSA', label: 'BS Accountancy' },
    { value: 'Other', label: 'Other' },
  ],
  business: [
    { value: 'BSBA', label: 'BS Business Admin.' },
    { value: 'BSA', label: 'BS Accountancy' },
    { value: 'BSED', label: 'BS Education' },
    { value: 'Other', label: 'Other' },
  ],
  arts: [
    { value: 'BSARCH', label: 'BS Architecture' },
    { value: 'Other', label: 'Other' },
  ],
  health: [
    { value: 'BSNursing', label: 'BS Nursing' },
    { value: 'Other', label: 'Other' },
  ],
  other: [
    { value: 'Other', label: 'Other' },
  ],
};

export default function Home() {
  const [userId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState<string>('');
  const [field, setField] = useState<string>('');
  const [program, setProgram] = useState<string>('');
  const [otherProgram, setOtherProgram] = useState<string>('');
  const [yearLevel, setYearLevel] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [isLocalTalking, setIsLocalTalking] = useState(false);
  const [isRemoteTalking, setIsRemoteTalking] = useState(false);
  const [showFireAnimation, setShowFireAnimation] = useState(false);
  const [remoteUserInfo, setRemoteUserInfo] = useState<UserInfo | null>(null);
  const [disconnectNotification, setDisconnectNotification] = useState<boolean>(false);
  const chatDeleteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 second
  
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const isInitiatorRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const localAudioContextRef = useRef<AudioContext | null>(null);
  const remoteAudioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);

  // Handle match found
  const handleMatchFound = async () => {
    try {
      setConnectionState('connecting');

      // Get microphone access
      await getUserMedia();

      // Create peer connection
      const pc = createPeerConnection();

      // If initiator, create and send offer
      if (isInitiatorRef.current) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        wsRef.current?.send(
          JSON.stringify({
            type: 'offer',
            data: offer,
          })
        );
      }
    } catch (err) {
      console.error('Error in handleMatchFound:', err);
      setError('Failed to establish connection');
      setConnectionState('disconnected');
    }
  };

  // Handle offer from partner
  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      await getUserMedia();
      const pc = createPeerConnection();

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      wsRef.current?.send(
        JSON.stringify({
          type: 'answer',
          data: answer,
        })
      );
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  };

  // Handle answer from partner
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      await peerConnectionRef.current?.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  };

  // Handle ICE candidate
  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      await peerConnectionRef.current?.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    } catch (err) {
      console.error('Error handling ICE candidate:', err);
    }
  };

  // Handle partner disconnected
  const handlePartnerDisconnected = () => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    setConnectionState('disconnected');
    setError('Buddy disconnected');
    setIsLocalTalking(false);
    setIsRemoteTalking(false);

    // Cleanup audio contexts
    if (remoteAudioContextRef.current) {
      remoteAudioContextRef.current.close();
      remoteAudioContextRef.current = null;
    }
    remoteAnalyserRef.current = null;
  };

  // Handle incoming chat message
  const handleChatMessage = (text: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      isMine: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Calculate exponential backoff delay for reconnection
  const getReconnectDelay = (attempt: number): number => {
    return Math.min(baseReconnectDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
  };

  // Heartbeat mechanism for connection health monitoring
  const startHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    
    heartbeatTimerRef.current = window.setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now()
        }));
      }
    }, 30000); // Send heartbeat every 30 seconds
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(function initializeWebSocket() {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(getWebSocketUrl(userId));
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
      setError(null);
      startHeartbeat();
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
      console.log('Received message:', message.type);

      switch (message.type) {
        case 'connected':
          setConnectionState('disconnected');
          break;

        case 'waiting':
          setConnectionState('waiting');
          break;

        case 'match_found':
          isInitiatorRef.current = message.is_initiator;
          setMessages([]); // Clear messages for new match
          setShowFireAnimation(true);
          setTimeout(() => setShowFireAnimation(false), 2000);
          await handleMatchFound();
          break;

        case 'partner_disconnected':
          handleBuddyDisconnected();
          break;
        
        case 'user_info':
          setRemoteUserInfo({
            nickname: message.nickname || 'Buddy',
            field: message.field || 'N/A',
            yearLevel: message.year_level || 'N/A'
          });
          break;

        case 'offer':
          await handleOffer(message.data);
          break;

        case 'answer':
          await handleAnswer(message.data);
          break;

        case 'ice_candidate':
          await handleIceCandidate(message.data);
          break;

        case 'chat_message':
          handleChatMessage(message.message);
          break;

        case 'online_count':
          setOnlineCount(message.count);
          break;

        case 'heartbeat':
          console.log('Heartbeat acknowledged');
          break;
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Attempting to reconnect...');
      setConnectionState('disconnected');
      stopHeartbeat();
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      stopHeartbeat();
      setConnectionState('disconnected');
      
      // Auto-reconnect with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = getReconnectDelay(reconnectAttemptsRef.current);
        console.log(`Attempting reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
        reconnectAttemptsRef.current++;
        
        setTimeout(() => {
          if (connectionState !== 'disconnected' || wsRef.current?.readyState !== WebSocket.OPEN) {
            initializeWebSocket();
          }
        }, delay);
      } else {
        setError('Connection failed after maximum attempts. Please refresh the page.');
      }
    };
  }, [userId, connectionState, startHeartbeat, stopHeartbeat, getReconnectDelay]);

  // Get user media (microphone)
  async function getUserMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      localStreamRef.current = stream;
      setupLocalAudioDetection(stream);
      return stream;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied. Please allow microphone access.');
      throw err;
    }
  }

  // Setup audio detection for local stream
  const setupLocalAudioDetection = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;
    
    microphone.connect(analyser);
    
    localAudioContextRef.current = audioContext;
    localAnalyserRef.current = analyser;
    
    detectLocalAudio();
  };

  // Detect local audio levels
  const detectLocalAudio = () => {
    if (!localAnalyserRef.current) return;
    
    const analyser = localAnalyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkAudio = () => {
      if (!localStreamRef.current) {
        setIsLocalTalking(false);
        return;
      }
      
      if (isMuted) {
        setIsLocalTalking(false);
        requestAnimationFrame(checkAudio);
        return;
      }
      
      analyser.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const threshold = 10; // Lower threshold = more sensitive
      
      setIsLocalTalking(average > threshold);
      
      requestAnimationFrame(checkAudio);
    };
    
    checkAudio();
  };

  // Setup audio detection for remote stream
  const setupRemoteAudioDetection = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;
    
    source.connect(analyser);
    
    remoteAudioContextRef.current = audioContext;
    remoteAnalyserRef.current = analyser;
    
    detectRemoteAudio();
  };

  // Detect remote audio levels
  const detectRemoteAudio = () => {
    if (!remoteAnalyserRef.current) return;
    
    const analyser = remoteAnalyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkAudio = () => {
      if (connectionState !== 'connected') {
        setIsRemoteTalking(false);
        return;
      }
      
      analyser.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const threshold = 10; // Lower threshold = more sensitive
      
      setIsRemoteTalking(average > threshold);
      
      requestAnimationFrame(checkAudio);
    };
    
    checkAudio();
  };

  // Create peer connection
  function createPeerConnection() {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('Received remote track');
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
        setupRemoteAudioDetection(event.streams[0]);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'ice_candidate',
            data: event.candidate,
          })
        );
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setConnectionState('connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        handlePartnerDisconnected();
      }
    };

    return pc;
  }

  // Sanitize chat input to prevent XSS
  const sanitizeChatInput = (input: string): string => {
    return input
      .replace(/[<>"'&]/g, (char) => {
        const escapeMap: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return escapeMap[char] || char;
      })
      .substring(0, 500); // Max 500 chars per message
  };

  // Sanitize nickname input
  const sanitizeNickname = (input: string): string => {
    return input
      .replace(/[<>"'&]/g, '')
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .trim()
      .substring(0, 20);
  };

  // Send chat message
  const sendMessage = () => {
    const sanitizedMessage = sanitizeChatInput(messageInput.trim());
    if (!sanitizedMessage || connectionState !== 'connected') return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: sanitizedMessage,
      isMine: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'chat_message',
          message: sanitizedMessage,
        })
      );
    }

    setMessageInput('');
  };

  // Handle Enter key in chat input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect network changes for connection restoration
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network restored');
      setError(null);
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        reconnectAttemptsRef.current = 0;
        initializeWebSocket();
      }
    };

    const handleOffline = () => {
      console.log('Network lost');
      setError('No internet connection. Waiting for network restoration...');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initializeWebSocket]);

  // Start call - find a match
  const startCall = () => {
    const selectedProgram = program === 'Other' ? otherProgram.trim() : program;
    const cleanedNickname = sanitizeNickname(nickname);

    if (!field || !selectedProgram || !yearLevel) {
      setError('Please select your field, program, and year level before starting a call');
      return;
    }

    if (!cleanedNickname || cleanedNickname.length < 2) {
      setError('Nickname must be at least 2 characters');
      return;
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      initializeWebSocket();
      setTimeout(() => startCall(), 1000);
      return;
    }

    setError(null);
    setConnectionState('waiting');
    wsRef.current.send(JSON.stringify({ 
      type: 'find_match',
      field: field,
      program: selectedProgram,
      year_level: yearLevel,
      interests: interests,
      nickname: cleanedNickname,
    }));
  };

  // Skip to next buddy
  const skipBuddy = () => {
    const selectedProgram = program === 'Other' ? otherProgram.trim() : program;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
      setConnectionState('waiting');
      setMessages([]); // Clear chat messages
      setRemoteUserInfo(null);
      wsRef.current.send(JSON.stringify({ 
        type: 'skip',
        field: field,
        program: selectedProgram,
        year_level: yearLevel,
        interests: interests,
      }));
    }
  };

  // Handle buddy disconnected - with auto-delete timer
  const handleBuddyDisconnected = () => {
    setConnectionState('disconnected');
    setRemoteUserInfo(null);
    setDisconnectNotification(true);
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    
    // Clear existing timer if any
    if (chatDeleteTimerRef.current) {
      clearTimeout(chatDeleteTimerRef.current);
    }
    
    // Auto-delete chat history after 5 minutes
    chatDeleteTimerRef.current = setTimeout(() => {
      setMessages([]);
      setDisconnectNotification(false);
    }, 5 * 60 * 1000);
  };

  // End call
  const endCall = () => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    setConnectionState('disconnected');
    setMessages([]); // Clear chat messages
    setRemoteUserInfo(null);
    setDisconnectNotification(false);
    setError(null);
    setIsLocalTalking(false);
    setIsRemoteTalking(false);
    
    // Clear timers
    if (chatDeleteTimerRef.current) {
      clearTimeout(chatDeleteTimerRef.current);
      chatDeleteTimerRef.current = null;
    }
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    
    // Cleanup audio contexts
    if (localAudioContextRef.current) {
      localAudioContextRef.current.close();
      localAudioContextRef.current = null;
    }
    if (remoteAudioContextRef.current) {
      remoteAudioContextRef.current.close();
      remoteAudioContextRef.current = null;
    }
    localAnalyserRef.current = null;
    remoteAnalyserRef.current = null;
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeWebSocket();
    return () => {
      endCall();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col px-4 md:px-0 bg-gradient-to-br from-[#0f0a07] via-[#1a1410] to-[#2d1f15]">
      {/* Header */}
      <header className="w-full flex flex-wrap md:flex-nowrap justify-between items-center gap-2 md:gap-0 px-8 py-6 border-b border-[#ff6b35]/20">
        <div className="flex items-center gap-3 flex-wrap">
          <img
            src="/HeaderLogo.png"
            alt="SYNCED"
            className="h-10 w-auto object-contain md:h-12"
            style={{ maxWidth: '180px' }}
          />
          <div className="ml-4 px-4 py-2 bg-[#ff6b35]/20 rounded-full border border-[#ff6b35]/40 hover:border-[#ff6b35]/60 transition-colors">
            <span className="text-white/90 text-sm font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-[#ff6b35] mr-2 animate-pulse"></span>
              {onlineCount} online
            </span>
          </div>
        </div>
        <nav className="flex gap-8 text-sm mr-0 md:mr-0">
          <Link href="/about" className="text-white/70 hover:text-white transition-colors">About</Link>
          <Link href="/rules" className="text-white/70 hover:text-white transition-colors">Rules</Link>
          <Link href="/privacy" className="text-white/70 hover:text-white transition-colors">Privacy</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden px-8 py-20 md:py-28 flex flex-col items-center text-center"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,107,53,0.13) 0%, transparent 70%)',
        }}
      >
        {/* Ambient grid lines */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,107,53,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,53,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Floating orbs */}
        <div className="pointer-events-none absolute top-8 left-[10%] w-48 h-48 rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #ff6b35, transparent)', filter: 'blur(32px)', animation: 'heroFloat1 8s ease-in-out infinite' }} />
        <div className="pointer-events-none absolute bottom-0 right-[8%] w-64 h-64 rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #ff8a5a, transparent)', filter: 'blur(40px)', animation: 'heroFloat2 10s ease-in-out infinite' }} />
        {/* Rotating conic glow */}
        <div className="pointer-events-none absolute top-[-60px] left-1/2 w-[520px] h-[520px] opacity-[0.06]"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, #ff6b35 15%, transparent 30%, #ff8a5a 55%, transparent 70%, #ff6b35 85%, transparent 100%)',
            borderRadius: '50%',
            filter: 'blur(28px)',
            animation: 'heroRotateGlow 12s linear infinite',
            transform: 'translateX(-50%)',
          }} />

        {/* Eyebrow label */}
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#ff6b35]/30 bg-[#ff6b35]/10 backdrop-blur-sm"
          style={{ animation: 'heroFadeUp 0.6s ease both' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b35] animate-pulse" />
          <span className="text-[#ff8a5a] text-xs font-semibold tracking-widest uppercase">Academic Voice Chat</span>
        </div>

        {/* Wordmark */}
        <div
          style={{ animation: 'heroFadeUp 0.6s 0.05s ease both', opacity: 0 }}
          className="mb-4"
        >
          <img
            src="/Wordmark.svg"
            alt="SYNCED"
            className="h-20 md:h-28 w-auto mx-auto"
          />
        </div>

        {/* Subheading */}
        <h2
          className="text-2xl md:text-4xl font-semibold tracking-tight text-white max-w-3xl leading-[1.15]"
          style={{
            fontFamily: "'Google Sans', sans-serif",
            letterSpacing: '-0.02em',
            animation: 'heroFadeUp 0.6s 0.1s ease both',
            opacity: 0,
          }}
        >
          Study smarter,{' '}
          <span className="relative inline-block">
            <span style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #ff8a5a 50%, #ffaa7a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              together.
            </span>
            {/* Underline accent */}
            <span className="absolute -bottom-1 left-0 w-full h-[3px] rounded-full"
              style={{ background: 'linear-gradient(90deg, #ff6b35, transparent)', animation: 'heroUnderline 0.8s 0.6s ease both', transformOrigin: 'left', transform: 'scaleX(0)' }} />
          </span>
        </h2>

        {/* Subheadline */}
        <p className="mt-6 text-white/50 text-lg md:text-xl max-w-xl leading-relaxed"
          style={{ fontFamily: "'Geist', sans-serif", animation: 'heroFadeUp 0.6s 0.2s ease both', opacity: 0 }}>
          Connect instantly with students across programs and year levels.
          Real voices, real learning — no sign-up required.
        </p>

        {/* Feature pills */}
        <div className="mt-10 flex flex-wrap justify-center gap-3"
          style={{ animation: 'heroFadeUp 0.6s 0.3s ease both', opacity: 0 }}>
          {[
            { top: 'Peer-to-Peer', bottom: 'Academic Exchange' },
            { top: 'Academic Context', bottom: 'Matching' },
            { top: 'Zero Footprint', bottom: 'Anonymity' },
            { top: 'Instant Re-Sync', bottom: 'Skip Functionality' },
            { top: 'Full Audio', bottom: 'Toggle Sovereignty' },
            { top: 'Real-Time', bottom: 'Status Transparency' },
          ].map((pill) => (
            <div key={pill.top + pill.bottom}
              className="flex flex-col items-center px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm text-white/70 text-sm font-medium transition-all duration-300 cursor-default"
              style={{ minWidth: '130px' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.07)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,107,53,0.5)';
                (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.95)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 18px rgba(255,107,53,0.18)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)';
                (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.7)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <span className="text-[#ff8a5a] text-xs font-semibold tracking-wide leading-tight">{pill.top}</span>
              <span className="text-white/60 text-xs leading-tight mt-0.5">{pill.bottom}</span>
            </div>
          ))}
        </div>

        {/* Scroll cue - Enhanced visibility */}
        <div className="mt-14 flex flex-col items-center gap-3 opacity-70"
          style={{ animation: 'heroFadeUp 0.6s 0.5s ease both' }}>
          <span className="text-xs tracking-widest text-[#ff6b35]/80 uppercase font-semibold">Start below</span>
          <div className="flex flex-col items-center gap-1">
            <div className="w-1.5 h-12 bg-gradient-to-b from-[#ff6b35] via-[#ff6b35] to-transparent" style={{ animation: 'scrollCue 1.6s ease-in-out infinite' }} />
            <div className="w-1.5 h-2 bg-[#ff6b35]" />
          </div>
        </div>

        <style>{`
          @keyframes heroFadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes heroUnderline {
            from { transform: scaleX(0); }
            to   { transform: scaleX(1); }
          }
          @keyframes heroFloat1 {
            0%, 100% { transform: translateY(0) translateX(0); }
            50%       { transform: translateY(-18px) translateX(8px); }
          }
          @keyframes heroFloat2 {
            0%, 100% { transform: translateY(0) translateX(0); }
            50%       { transform: translateY(14px) translateX(-10px); }
          }
          @keyframes scrollCue {
            0%, 100% { opacity: 0.3; transform: scaleY(1); }
            50%       { opacity: 1;   transform: scaleY(1.2); }
          }
          @keyframes heroRotateGlow {
            0%   { transform: translateX(-50%) rotate(0deg); }
            100% { transform: translateX(-50%) rotate(360deg); }
          }
        `}</style>
      </section>

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden p-4 md:p-8">
        {/* Left Side - Voice Call Controls */}
        <main className="flex-1 flex flex-col min-h-0 bg-[#1a1410]/60 backdrop-blur-md rounded-2xl border border-[#ff6b35]/30 hover:border-[#ff6b35]/50 transition-colors p-4 md:p-8">
          {/* Status Display */}
          <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-12">
            <div className="mb-6 relative">
              {connectionState === 'disconnected' && (
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-[#ff6b35]/20 to-[#ff8a5a]/20 flex items-center justify-center border-4 border-[#ff6b35]/40">
                  <Phone className="w-12 h-12 text-[#ff6b35]" />
                </div>
              )}
              {connectionState === 'waiting' && (
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-[#ff6b35]/20 to-[#ff8a5a]/20 flex items-center justify-center border-4 border-[#ff6b35]/60 animate-pulse">
                  <Loader2 className="w-12 h-12 text-[#ff6b35] animate-spin" />
                </div>
              )}
              {connectionState === 'connecting' && (
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-[#ff6b35]/20 to-[#ff8a5a]/20 flex items-center justify-center border-4 border-[#ff6b35]/60 animate-pulse">
                  <Phone className="w-12 h-12 text-[#ff6b35]" />
                </div>
              )}
              {connectionState === 'connected' && (
                <div className="flex items-center justify-center gap-8">
                  {/* Left Avatar - You */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#ff8a5a] flex items-center justify-center border-4 border-[#ff6b35]/60 shadow-lg shadow-[#ff6b35]/30">
                        <User className="w-10 h-10 text-white" />
                      </div>
                      {/* Talking indicator - animated ring */}
                      {isLocalTalking && !isMuted && (
                        <div className="absolute inset-0 rounded-full border-4 border-[#ff6b35] animate-ping opacity-75"></div>
                      )}
                    </div>
                    <span className="text-white/80 text-sm font-medium">You</span>
                  </div>

                  {/* Connection Line */}
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-0.5 bg-[#ff6b35]/60 animate-pulse"></div>
                    <Phone className="w-5 h-5 text-[#ff6b35] animate-pulse" />
                    <div className="w-8 h-0.5 bg-[#ff6b35]/60 animate-pulse"></div>
                  </div>

                  {/* Right Avatar - Buddy */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#ff8a5a] flex items-center justify-center border-4 border-[#ff6b35]/60 shadow-lg shadow-[#ff6b35]/30">
                        <User className="w-10 h-10 text-white" />
                      </div>
                      {/* Talking indicator - shows when buddy talks */}
                      {isRemoteTalking && (
                        <div className="absolute inset-0 rounded-full border-4 border-[#ff6b35] animate-ping opacity-75"></div>
                      )}
                    </div>
                    <div className="text-center">
                      <span className="text-white/80 text-sm font-medium block">{remoteUserInfo?.nickname || 'Buddy'}</span>
                      {remoteUserInfo && (
                        <>
                          <span className="text-white/60 text-xs block">{remoteUserInfo.field}</span>
                          <span className="text-white/60 text-xs block">Year {remoteUserInfo.yearLevel}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <h2 className="text-4xl font-bold mb-4 text-white" style={{ fontFamily: "'Google Sans', sans-serif" }}>
              {connectionState === 'disconnected' && 'Find your study buddy.'}
              {connectionState === 'waiting' && 'Finding a peer...'}
              {connectionState === 'connecting' && 'Connecting...'}
              {connectionState === 'connected' && 'Connected'}
            </h2>

            <p className="text-white/60 text-lg max-w-md mx-auto">
              {connectionState === 'disconnected' &&
                'Connect with students across different programs and year levels. Collaborate, mentor, and grow together.'}
              {connectionState === 'waiting' && 'Searching for a compatible study buddy...'}
              {connectionState === 'connecting' && 'Establishing secure connection...'}
              {connectionState === 'connected' && "You're now connected. Start your academic journey together!"}
            </p>

            {error && (
              <div className="mt-4 px-6 py-3 bg-[#ff6b35]/20 border border-[#ff6b35]/40 rounded-lg text-[#ff8a5a] text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-4 items-center justify-center flex-wrap mb-4">
            {connectionState === 'disconnected' ? (
              <button
                onClick={startCall}
                className="w-full max-w-sm md:w-auto px-8 py-4 bg-gradient-to-r from-[#ff6b35] to-[#ff8a5a] hover:from-[#ff8a5a] hover:to-[#ffaa7a] text-white rounded-full font-bold transition-all flex items-center justify-center gap-3 text-lg shadow-lg shadow-[#ff6b35]/40 hover:shadow-[#ff6b35]/60 hover:scale-105"
              >
                <img src="/syncedIcon.svg" alt="Sync" className="w-10 h-8" />
                Sync Now
              </button>
            ) : (
              <>
                {(connectionState === 'connected' || connectionState === 'connecting') && (
                  <>
                    <button
                      onClick={toggleMute}
                      className={`p-4 rounded-full transition-all ${
                        isMuted
                          ? 'bg-[#ff6b35]/40 hover:bg-[#ff6b35]/60 border border-[#ff6b35]/60'
                          : 'bg-[#ff6b35] hover:bg-[#ff8a5a]'
                      } text-white shadow-lg hover:scale-105`}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    <button
                      onClick={skipBuddy}
                      className="p-4 bg-[#ff6b35]/30 hover:bg-[#ff6b35]/50 border border-[#ff6b35]/40 text-white rounded-full transition-all shadow-lg hover:scale-105"
                      title="Skip to next person"
                    >
                      <SkipForward className="w-6 h-6" />
                    </button>
                  </>
                )}

                <button
                  onClick={endCall}
                  className="px-8 py-4 bg-[#ff6b35]/20 hover:bg-[#ff6b35]/40 border border-[#ff6b35]/40 text-[#ff8a5a] rounded-full font-bold transition-all flex items-center gap-3 text-lg shadow-lg hover:scale-105"
                >
                  <PhoneOff className="w-6 h-6" />
                  End Call
                </button>
              </>
            )}
          </div>
          </div>

          {/* Filters at Bottom - Academic Profile */}
          {connectionState === 'disconnected' && (
            <div className="flex flex-col gap-4 items-center justify-center pt-4 border-t border-[#ff6b35]/20">
              {/* Field Selection */}
              <div className="flex items-center gap-2 px-4 py-2 bg-[#0f0a07]/60 rounded-lg border border-[#ff6b35]/30 cursor-pointer hover:bg-[#1a1410] hover:border-[#ff6b35]/50 transition-all w-full md:w-auto">
                <User className="w-4 h-4 text-[#ff6b35]" />
                <span className="text-white text-sm font-medium">Field of Study:</span>
                <select
                  value={field}
                  onChange={(e) => {
                    setField(e.target.value);
                    setProgram('');
                    setOtherProgram('');
                  }}
                  className="bg-transparent text-white text-sm focus:outline-none cursor-pointer font-medium ml-auto"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" style={{ backgroundColor: '#1a1410', color: 'white' }}>Select</option>
                  <option value="stem" style={{ backgroundColor: '#1a1410', color: 'white' }}>STEM</option>
                  <option value="humanities" style={{ backgroundColor: '#1a1410', color: 'white' }}>Humanities</option>
                  <option value="social-sciences" style={{ backgroundColor: '#1a1410', color: 'white' }}>Social Sciences</option>
                  <option value="business" style={{ backgroundColor: '#1a1410', color: 'white' }}>Business</option>
                  <option value="arts" style={{ backgroundColor: '#1a1410', color: 'white' }}>Arts & Design</option>
                  <option value="health" style={{ backgroundColor: '#1a1410', color: 'white' }}>Health Sciences</option>
                  <option value="other" style={{ backgroundColor: '#1a1410', color: 'white' }}>Other</option>
                </select>
              </div>

              {/* Program Selection */}
              {field && (
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#0f0a07]/60 rounded-lg border border-[#ff6b35]/30 cursor-pointer hover:bg-[#1a1410] hover:border-[#ff6b35]/50 transition-all w-full md:w-auto">
                    <Globe className="w-4 h-4 text-[#ff6b35]" />
                    <span className="text-white text-sm font-medium">Program:</span>
                    <select
                      value={program}
                      onChange={(e) => {
                        setProgram(e.target.value);
                        if (e.target.value !== 'Other') {
                          setOtherProgram('');
                        }
                      }}
                      className="bg-transparent text-white text-sm focus:outline-none cursor-pointer font-medium ml-auto"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" style={{ backgroundColor: '#1a1410', color: 'white' }}>Select</option>
                      {(PROGRAM_OPTIONS_MAP[field] ?? PROGRAM_OPTIONS_MAP.other).map((option) => (
                        <option key={option.value} value={option.value} style={{ backgroundColor: '#1a1410', color: 'white' }}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {program === 'Other' && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#0f0a07]/60 rounded-lg border border-[#ff6b35]/30 transition-all w-full md:w-[320px]">
                      <span className="text-white text-sm font-medium">Please specify:</span>
                      <input
                        type="text"
                        value={otherProgram}
                        onChange={(e) => setOtherProgram(e.target.value)}
                        placeholder="Your program"
                        className="flex-1 bg-transparent text-white text-sm focus:outline-none font-medium placeholder:text-white/40"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Year Level Selection */}
              <div className="flex items-center gap-2 px-4 py-2 bg-[#0f0a07]/60 rounded-lg border border-[#ff6b35]/30 cursor-pointer hover:bg-[#1a1410] hover:border-[#ff6b35]/50 transition-all w-full md:w-auto">
                <User className="w-4 h-4 text-[#ff6b35]" />
                <span className="text-white text-sm font-medium">Year Level:</span>
                <select
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                  className="bg-transparent text-white text-sm focus:outline-none cursor-pointer font-medium ml-auto"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" style={{ backgroundColor: '#1a1410', color: 'white' }}>Select</option>
                  <option value="1st" style={{ backgroundColor: '#1a1410', color: 'white' }}>1st Year</option>
                  <option value="2nd" style={{ backgroundColor: '#1a1410', color: 'white' }}>2nd Year</option>
                  <option value="3rd" style={{ backgroundColor: '#1a1410', color: 'white' }}>3rd Year</option>
                  <option value="4th" style={{ backgroundColor: '#1a1410', color: 'white' }}>4th Year</option>
                  <option value="graduate" style={{ backgroundColor: '#1a1410', color: 'white' }}>Graduate</option>
                </select>
              </div>

              {/* Nickname and Subject/Topic on bottom - side by side */}
              <div className="flex gap-3 items-start w-full flex-col md:flex-row">
                {/* Nickname Input */}
                <div className="flex items-center gap-2 px-4 py-2 bg-[#0f0a07]/60 rounded-lg border border-[#ff6b35]/30 w-full md:w-auto md:flex-shrink-0">
                  <User className="w-4 h-4 text-[#ff6b35]" />
                  <span className="text-white text-sm font-medium whitespace-nowrap">Nickname:</span>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value.substring(0, 20))}
                    placeholder="Display name"
                    maxLength={20}
                    className="flex-1 md:flex-none md:w-32 bg-transparent text-white text-sm focus:outline-none font-medium placeholder:text-white/40"
                  />
                </div>

                {/* Interests/Topics */}
                <div className="flex gap-2 items-start w-full">
                  <span className="text-white text-sm mt-2 font-medium whitespace-nowrap">Subject / Topic:</span>
                  <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-[#0f0a07]/60 rounded-lg border border-[#ff6b35]/30 max-w-full flex-1">
                    {interests.map((tag, index) => (
                      <div key={index} className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-[#ff6b35] to-[#ff8a5a] rounded-full text-white text-xs shrink-0 font-medium">
                        <span>{tag}</span>
                        <button
                          onClick={() => setInterests(interests.filter((_, i) => i !== index))}
                          className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && interestInput.trim()) {
                          e.preventDefault();
                          if (!interests.includes(interestInput.trim())) {
                            setInterests([...interests, interestInput.trim()]);
                          }
                          setInterestInput('');
                        }
                      }}
                      placeholder={interests.length === 0 ? "Type topic and press Enter" : ""}
                      className="bg-transparent text-white text-sm focus:outline-none placeholder:text-white/40 min-w-25 flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Side - Chat Panel */}
        <aside className="w-full md:w-96 h-96 md:h-auto bg-[#1a1410]/60 backdrop-blur-md rounded-2xl border border-[#ff6b35]/30 hover:border-[#ff6b35]/50 transition-colors flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-[#ff6b35]/20 bg-[#0f0a07]/40">
            <h3 className="text-white font-bold" style={{ fontFamily: "'Google Sans', sans-serif" }}>Chat</h3>
            {disconnectNotification && (
              <div className="mt-2 p-2 bg-[#ff6b35]/20 border border-[#ff6b35]/40 rounded text-[#ff8a5a] text-xs">
                ⏱ Your chats with the previous person will be deleted after 5 minutes.
              </div>
            )}
            <p className="text-white/60 text-sm mt-1">
              {connectionState === 'connected' ? 'Send messages to your buddy' : 'Connect to start chatting'}
            </p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/40 text-sm text-center px-4">
                {connectionState === 'connected' 
                  ? 'No messages yet. Start the conversation!' 
                  : 'Messages will appear here when you connect'}
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        msg.isMine
                          ? 'bg-gradient-to-r from-[#ff6b35] to-[#ff8a5a] text-white'
                          : 'bg-[#2d1f15] border border-[#ff6b35]/30 text-white'
                      }`}
                    >
                      <p className="text-sm wrap-break-word">{msg.text}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-[#ff6b35]/20 bg-[#0f0a07]/40">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={connectionState !== 'connected'}
                placeholder={connectionState === 'connected' ? 'Type a message...' : 'Connect to chat'}
                className="flex-1 px-4 py-2 bg-[#0f0a07] border border-[#ff6b35]/30 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff6b35]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim() || connectionState !== 'connected'}
                className="p-2 bg-gradient-to-r from-[#ff6b35] to-[#ff8a5a] hover:from-[#ff8a5a] hover:to-[#ffaa7a] text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-[#ff6b35] disabled:hover:to-[#ff8a5a]"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="w-full text-center text-white/40 text-sm py-8 border-t border-[#ff6b35]/10 mt-8">
        <p>Academic connection through voice is a science.</p>
        <p className="mt-2">Stay respectful. Collaborate meaningfully.</p>
        <p className="mt-4 text-xs">© {new Date().getFullYear()} SYNCED. All rights reserved.</p>
      </footer>

      {/* Hidden audio element for remote stream */}
      <audio ref={remoteAudioRef} autoPlay />
      
      {/* Fire Animation Overlay */}
      {showFireAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative">
            <div className="text-9xl animate-bounce">🔥</div>
            <div className="absolute top-0 left-0 text-9xl animate-ping opacity-75">🔥</div>
            <div className="mt-4 text-4xl font-bold text-[#ff6b35] text-center animate-pulse" style={{ fontFamily: "'Google Sans', sans-serif" }}>Match Found!</div>
          </div>
        </div>
      )}
    </div>
  );
}