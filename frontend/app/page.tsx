'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Phone, PhoneOff, Mic, MicOff, SkipForward, Loader2, Send, User, Globe, X } from 'lucide-react';

// WebSocket server URL - use environment variable or fallback to localhost
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

// ICE servers for WebRTC
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

type ConnectionState = 'disconnected' | 'connecting' | 'waiting' | 'connected';

interface ChatMessage {
  id: string;
  text: string;
  isMine: boolean;
  timestamp: Date;
}

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
  const [genderPreference, setGenderPreference] = useState<string>('any');
  const [userGender, setUserGender] = useState<string>('');
  const [isLocalTalking, setIsLocalTalking] = useState(false);
  const [isRemoteTalking, setIsRemoteTalking] = useState(false);
  const [showFireAnimation, setShowFireAnimation] = useState(false);
  
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

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_URL}/${userId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setError(null);
    };

    ws.onmessage = async (event) => {
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
          handlePartnerDisconnected();
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
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Please try again.');
      setConnectionState('disconnected');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionState('disconnected');
      setTimeout(() => {
        if (connectionState !== 'disconnected') {
          initializeWebSocket();
        }
      }, 3000);
    };
  }, [userId, connectionState]);

  // Get user media (microphone)
  const getUserMedia = async () => {
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
  };

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
  const createPeerConnection = () => {
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
  };

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
    setError('Partner disconnected');
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

  // Send chat message
  const sendMessage = () => {
    if (!messageInput.trim() || connectionState !== 'connected') return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageInput,
      isMine: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'chat_message',
          message: messageInput,
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

  // Start call - find a match
  const startCall = () => {
    if (!userGender) {
      setError('Please select your gender before starting a call');
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
      interests: interests,
      gender_pref: genderPreference,
      user_gender: userGender
    }));
  };

  // Skip to next partner
  const skipPartner = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
      setConnectionState('waiting');
      setMessages([]); // Clear chat messages
      wsRef.current.send(JSON.stringify({ 
        type: 'skip',
        interests: interests,
        gender_pref: genderPreference,
        user_gender: userGender
      }));
    }
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
    setError(null);
    setIsLocalTalking(false);
    setIsRemoteTalking(false);
    
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
    <div className="min-h-screen flex flex-col px-4 md:px-0">
      {/* Header */}
      <header className="w-full flex flex-wrap md:flex-nowrap justify-between items-center gap-2 md:gap-0">
        <div className="flex items-center gap-1 px-3 py-4 mb-2 mt-1 flex-wrap">
          <img src="/logo.png" alt="Logo" className="w-10 h-10" />
          <h1 className="text-4xl font-bold tracking-wide text-white">Spark</h1>
          <div className="ml-4 px-3 py-1 bg-[#4a5d4a]/50 rounded-full border border-[#6b8e6b]/30">
            <span className="text-white/80 text-sm">
              <span className="inline-block w-2 h-2 rounded-full bg-[#6b8e6b] mr-2 animate-pulse"></span>
              {onlineCount} online
            </span>
          </div>
        </div>
        <nav className="flex gap-8 text-sm mr-0 md:mr-8">
          <Link href="/about" className="text-white/80 hover:text-white transition-colors">About</Link>
          <Link href="/rules" className="text-white/80 hover:text-white transition-colors">Rules</Link>
          <Link href="/privacy" className="text-white/80 hover:text-white transition-colors">Privacy</Link>
        </nav>
      </header>

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden pr-0 md:pr-8">
        {/* Left Side - Voice Call Controls */}
        <main className="flex-1 flex flex-col min-h-0 bg-[#2d3a2d]/50 backdrop-blur-sm rounded-2xl border border-[#4a5d4a] ml-0 md:ml-9 p-4 md:p-8">
          {/* Status Display */}
          <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-12">
            <div className="mb-6 relative">
              {connectionState === 'disconnected' && (
                <div className="w-32 h-32 mx-auto rounded-full bg-[#4a5d4a] flex items-center justify-center border-4 border-[#5a6d5a]">
                  <Phone className="w-12 h-12 text-white" />
                </div>
              )}
              {connectionState === 'waiting' && (
                <div className="w-32 h-32 mx-auto rounded-full bg-[#4a5d4a] flex items-center justify-center border-4 border-[#6b8e6b] animate-pulse">
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
              )}
              {connectionState === 'connecting' && (
                <div className="w-32 h-32 mx-auto rounded-full bg-[#4a5d4a] flex items-center justify-center border-4 border-[#6b8e6b] animate-pulse">
                  <Phone className="w-12 h-12 text-white" />
                </div>
              )}
              {connectionState === 'connected' && (
                <div className="flex items-center justify-center gap-8">
                  {/* Left Avatar - You */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-[#6b8e6b] flex items-center justify-center border-4 border-[#7a9e7a] shadow-lg shadow-[#6b8e6b]/50">
                        <User className="w-10 h-10 text-white" />
                      </div>
                      {/* Talking indicator - animated ring */}
                      {isLocalTalking && !isMuted && (
                        <div className="absolute inset-0 rounded-full border-4 border-[#6b8e6b] animate-ping opacity-75"></div>
                      )}
                    </div>
                    <span className="text-white/80 text-sm font-medium">You</span>
                  </div>

                  {/* Connection Line */}
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-0.5 bg-[#6b8e6b] animate-pulse"></div>
                    <Phone className="w-5 h-5 text-[#6b8e6b] animate-pulse" />
                    <div className="w-8 h-0.5 bg-[#6b8e6b] animate-pulse"></div>
                  </div>

                  {/* Right Avatar - Stranger */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-[#6b8e6b] flex items-center justify-center border-4 border-[#7a9e7a] shadow-lg shadow-[#6b8e6b]/50">
                        <User className="w-10 h-10 text-white" />
                      </div>
                      {/* Talking indicator - shows when stranger talks */}
                      {isRemoteTalking && (
                        <div className="absolute inset-0 rounded-full border-4 border-[#6b8e6b] animate-ping opacity-75"></div>
                      )}
                    </div>
                    <span className="text-white/80 text-sm font-medium">Stranger</span>
                  </div>
                </div>
              )}
            </div>

            <h2 className="text-4xl font-light mb-4 text-white">
              {connectionState === 'disconnected' && 'Anonymous voice chat.'}
              {connectionState === 'waiting' && 'Finding a partner...'}
              {connectionState === 'connecting' && 'Connecting...'}
              {connectionState === 'connected' && 'Connected'}
            </h2>

            <p className="text-white/60 text-lg max-w-md mx-auto">
              {connectionState === 'disconnected' &&
                'Connect with random strangers worldwide through voice. No sign-up required.'}
              {connectionState === 'waiting' && 'Searching for someone to talk to...'}
              {connectionState === 'connecting' && 'Establishing secure connection...'}
              {connectionState === 'connected' && "You're now connected. Enjoy your conversation!"}
            </p>

            {error && (
              <div className="mt-4 px-6 py-3 bg-[#8b4949]/20 border border-[#8b4949] rounded-lg text-[#ff9999] text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-4 items-center justify-center">
            {connectionState === 'disconnected' ? (
              <button
                onClick={startCall}
                className="px-8 py-4 bg-[#6b8e6b] hover:bg-[#7a9e7a] text-white rounded-full font-medium transition-all flex items-center gap-3 text-lg shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Phone className="w-6 h-6" />
                Start Call
              </button>
            ) : (
              <>
                {(connectionState === 'connected' || connectionState === 'connecting') && (
                  <>
                    <button
                      onClick={toggleMute}
                      className={`p-4 rounded-full transition-all ${
                        isMuted
                          ? 'bg-[#8b4949] hover:bg-[#9b5959]'
                          : 'bg-[#4a5d4a] hover:bg-[#5a6d5a]'
                      } text-white shadow-lg hover:scale-105`}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    <button
                      onClick={skipPartner}
                      className="p-4 bg-[#4a5d4a] hover:bg-[#5a6d5a] text-white rounded-full transition-all shadow-lg hover:scale-105"
                      title="Skip to next person"
                    >
                      <SkipForward className="w-6 h-6" />
                    </button>
                  </>
                )}

                <button
                  onClick={endCall}
                  className="px-8 py-4 bg-[#8b4949] hover:bg-[#9b5959] text-white rounded-full font-medium transition-all flex items-center gap-3 text-lg shadow-lg hover:scale-105"
                >
                  <PhoneOff className="w-6 h-6" />
                  End Call
                </button>
              </>
            )}
          </div>
          </div>

          {/* Filters at Bottom - OmeTV Style */}
          {connectionState === 'disconnected' && (
            <div className="flex flex-col gap-3 items-center justify-center pt-4 border-t border-[#4a5d4a]/50">
              <div className="flex gap-3 items-start">
                <span className="text-white text-sm mt-2">Interests:</span>
                <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-[#3a4a3a] rounded-lg border border-[#4a5d4a] max-w-70">
                  {interests.map((tag, index) => (
                    <div key={index} className="flex items-center gap-1 px-2 py-0.5 bg-[#6b8e6b] rounded-full text-white text-xs shrink-0">
                      <span>{tag}</span>
                      <button
                        onClick={() => setInterests(interests.filter((_, i) => i !== index))}
                        className="hover:bg-[#5a7d5a] rounded-full p-0.5 transition-colors"
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
                    placeholder={interests.length === 0 ? "Type and press Enter" : ""}
                    className="bg-transparent text-white text-sm focus:outline-none placeholder:text-white/40 min-w-25"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-[#3a4a3a] rounded-lg border border-[#4a5d4a] cursor-pointer hover:bg-[#4a5d4a] transition-colors">
                  <User className="w-4 h-4 text-white" />
                  <span className="text-white text-sm">I am:</span>
                  <select
                    value={userGender}
                    onChange={(e) => setUserGender(e.target.value)}
                    className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="" style={{ backgroundColor: '#3a4a3a', color: 'white' }}>Select</option>
                    <option value="male" style={{ backgroundColor: '#3a4a3a', color: 'white' }}>Male</option>
                    <option value="female" style={{ backgroundColor: '#3a4a3a', color: 'white' }}>Female</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#3a4a3a] rounded-lg border border-[#4a5d4a] cursor-pointer hover:bg-[#4a5d4a] transition-colors">
                  <User className="w-4 h-4 text-white" />
                  <span className="text-white text-sm">Match with:</span>
                  <select
                    value={genderPreference}
                    onChange={(e) => setGenderPreference(e.target.value)}
                    className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="any" style={{ backgroundColor: '#3a4a3a', color: 'white' }}>Anyone</option>
                    <option value="male" style={{ backgroundColor: '#3a4a3a', color: 'white' }}>Male</option>
                    <option value="female" style={{ backgroundColor: '#3a4a3a', color: 'white' }}>Female</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Side - Chat Panel */}
        <aside className="w-full md:w-96 h-96 md:h-auto bg-[#2d3a2d]/50 backdrop-blur-sm rounded-2xl border border-[#4a5d4a] flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-[#4a5d4a]">
            <h3 className="text-white font-medium">Chat</h3>
            <p className="text-white/60 text-sm">
              {connectionState === 'connected' ? 'Send messages to your partner' : 'Connect to start chatting'}
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
                          ? 'bg-[#6b8e6b] text-white'
                          : 'bg-[#4a5d4a] text-white'
                      }`}
                    >
                      <p className="text-sm wrap-break-word">{msg.text}</p>
                      <span className="text-xs opacity-60 mt-1 block">
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
          <div className="p-4 border-t border-[#4a5d4a]">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={connectionState !== 'connected'}
                placeholder={connectionState === 'connected' ? 'Type a message...' : 'Connect to chat'}
                className="flex-1 px-4 py-2 bg-[#3a4a3a] border border-[#4a5d4a] rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-[#6b8e6b] disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim() || connectionState !== 'connected'}
                className="p-2 bg-[#6b8e6b] hover:bg-[#7a9e7a] text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#6b8e6b]"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="w-full text-center text-white/40 text-sm mt-8">
        <p>Anonymous voice communication is a science.</p>
        <p className="mt-2">Stay safe. Be respectful. Report abuse.</p>
        <p className="mt-4 text-xs">© {new Date().getFullYear()} Spark. All rights reserved.</p>
      </footer>

      {/* Hidden audio element for remote stream */}
      <audio ref={remoteAudioRef} autoPlay />
      
      {/* Fire Animation Overlay */}
      {showFireAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative">
            <div className="text-9xl animate-bounce">🔥</div>
            <div className="absolute top-0 left-0 text-9xl animate-ping opacity-75">🔥</div>
            <div className="mt-4 text-4xl font-bold text-white text-center animate-pulse">Match Found!</div>
          </div>
        </div>
      )}
    </div>
  );
}
