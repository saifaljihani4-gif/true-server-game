import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, PhoneCall, PhoneOff, Radio, ChevronUp, ChevronDown } from 'lucide-react';
import type { Socket } from 'socket.io-client';

interface VoiceUser {
  peerId: string;
  name: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

interface VoiceBarProps {
  socket: Socket;
  code: string;
  playerName: string;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export function VoiceBar({ socket, code, playerName }: VoiceBarProps) {
  const [inVoice, setInVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState<VoiceUser[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [expanded, setExpanded] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Clean cleanup function
  const leaveVoice = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();

    audioElementsRef.current.forEach(audio => {
      audio.srcObject = null;
      audio.remove();
    });
    audioElementsRef.current.clear();

    socket.emit('voice_leave', { code });
    setInVoice(false);
    setIsSpeaking(false);
    setVoiceUsers([]);
    setErrorMsg('');
  }, [code, socket]);

  // Create PeerConnection for a remote peer
  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionsRef.current.set(peerId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('voice_ice_candidate', { targetPeerId: peerId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      let audio = audioElementsRef.current.get(peerId);
      if (!audio) {
        audio = document.createElement('audio');
        audio.autoplay = true;
        document.body.appendChild(audio);
        audioElementsRef.current.set(peerId, audio);
      }
      audio.srcObject = event.streams[0];
      audio.muted = isDeafened;
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        const audio = audioElementsRef.current.get(peerId);
        if (audio) {
          audio.srcObject = null;
          audio.remove();
          audioElementsRef.current.delete(peerId);
        }
        pc.close();
        peerConnectionsRef.current.delete(peerId);
      }
    };

    return pc;
  }, [isDeafened, socket]);

  // Join Voice Channel
  const joinVoice = async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      localStreamRef.current = stream;

      // Audio volume analysis for speaking detection
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let speakingState = false;

        const checkSpeaking = () => {
          if (!analyserRef.current || !localStreamRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const nowSpeaking = avg > 14 && !isMuted;

          if (nowSpeaking !== speakingState) {
            speakingState = nowSpeaking;
            setIsSpeaking(nowSpeaking);
            socket.emit('voice_state_update', { code, isMuted, isSpeaking: nowSpeaking });
          }
          animFrameRef.current = requestAnimationFrame(checkSpeaking);
        };
        checkSpeaking();
      } catch (e) {
        // Fallback if AudioContext is restricted
      }

      setInVoice(true);
      setIsMuted(false);
      socket.emit('voice_join', { code, name: playerName, isMuted: false });
    } catch (err: any) {
      console.warn('Microphone access issue:', err);
      setErrorMsg('تعذر تفعيل المايكروفون. تأكد من إعطاء الصلاحية في المتصفح.');
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const next = !isMuted;
    localStreamRef.current.getAudioTracks().forEach(t => {
      t.enabled = !next;
    });
    setIsMuted(next);
    if (next) setIsSpeaking(false);
    socket.emit('voice_state_update', { code, isMuted: next, isSpeaking: false });
  };

  // Toggle Deafen
  const toggleDeafen = () => {
    const next = !isDeafened;
    setIsDeafened(next);
    audioElementsRef.current.forEach(audio => {
      audio.muted = next;
    });
  };

  // Socket WebRTC Listeners
  useEffect(() => {
    if (!inVoice) return;

    const onCurrentUsers = async (users: VoiceUser[]) => {
      setVoiceUsers(users);
      // For each existing user, initiate WebRTC offer
      for (const u of users) {
        try {
          const pc = createPeerConnection(u.peerId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('voice_offer', { targetPeerId: u.peerId, offer });
        } catch (err) {
          console.warn('Error creating offer for peer:', u.peerId, err);
        }
      }
    };

    const onUserJoined = (user: VoiceUser) => {
      setVoiceUsers(prev => {
        if (prev.some(u => u.peerId === user.peerId)) return prev;
        return [...prev, user];
      });
    };

    const onOffer = async ({ senderPeerId, offer }: { senderPeerId: string; offer: RTCSessionDescriptionInit }) => {
      try {
        const pc = createPeerConnection(senderPeerId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('voice_answer', { targetPeerId: senderPeerId, answer });
      } catch (err) {
        console.warn('Error responding to offer:', err);
      }
    };

    const onAnswer = async ({ senderPeerId, answer }: { senderPeerId: string; answer: RTCSessionDescriptionInit }) => {
      try {
        const pc = peerConnectionsRef.current.get(senderPeerId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.warn('Error setting remote answer:', err);
      }
    };

    const onIceCandidate = async ({ senderPeerId, candidate }: { senderPeerId: string; candidate: RTCIceCandidateInit }) => {
      try {
        const pc = peerConnectionsRef.current.get(senderPeerId);
        if (pc && candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.warn('Error adding ice candidate:', err);
      }
    };

    const onUserStateChanged = ({ peerId, isMuted: peerMuted, isSpeaking: peerSpeaking }: { peerId: string; isMuted?: boolean; isSpeaking?: boolean }) => {
      setVoiceUsers(prev => prev.map(u => {
        if (u.peerId === peerId) {
          return {
            ...u,
            isMuted: peerMuted !== undefined ? peerMuted : u.isMuted,
            isSpeaking: peerSpeaking !== undefined ? peerSpeaking : u.isSpeaking
          };
        }
        return u;
      }));
    };

    const onUserLeft = ({ peerId }: { peerId: string }) => {
      const audio = audioElementsRef.current.get(peerId);
      if (audio) {
        audio.srcObject = null;
        audio.remove();
        audioElementsRef.current.delete(peerId);
      }
      const pc = peerConnectionsRef.current.get(peerId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(peerId);
      }
      setVoiceUsers(prev => prev.filter(u => u.peerId !== peerId));
    };

    socket.on('voice_current_users', onCurrentUsers);
    socket.on('voice_user_joined', onUserJoined);
    socket.on('voice_offer', onOffer);
    socket.on('voice_answer', onAnswer);
    socket.on('voice_ice_candidate', onIceCandidate);
    socket.on('voice_user_state_changed', onUserStateChanged);
    socket.on('voice_user_left', onUserLeft);

    return () => {
      socket.off('voice_current_users', onCurrentUsers);
      socket.off('voice_user_joined', onUserJoined);
      socket.off('voice_offer', onOffer);
      socket.off('voice_answer', onAnswer);
      socket.off('voice_ice_candidate', onIceCandidate);
      socket.off('voice_user_state_changed', onUserStateChanged);
      socket.off('voice_user_left', onUserLeft);
    };
  }, [inVoice, socket, createPeerConnection]);

  // Clean on unmount
  useEffect(() => {
    return () => {
      leaveVoice();
    };
  }, [leaveVoice]);

  const totalConnected = voiceUsers.length + (inVoice ? 1 : 0);

  return (
    <aside aria-label="شريط الفويس الصوتي" className="w-full max-w-full z-40 my-1 transition-all">
      {errorMsg && (
        <div className="w-full max-w-md mx-auto mb-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs text-center font-bold">
          {errorMsg}
        </div>
      )}

      {!inVoice ? (
        <div className="flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md max-w-md mx-auto">
          <div className="flex items-center gap-2 px-2">
            <Radio size={16} className="text-emerald-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-gray-200">فويس الروم المباشر</span>
          </div>

          <button
            onClick={joinVoice}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all"
          >
            <PhoneCall size={14} />
            <span>دخول الفويس</span>
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md mx-auto flex flex-col rounded-2xl bg-[#0f1118]/90 border border-emerald-500/40 p-2 shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-md">
          {/* Main Controls Row */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={toggleMute}
                className={`p-2 rounded-xl font-bold flex items-center justify-center transition-all ${
                  isMuted
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                    : isSpeaking
                    ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.8)] scale-105'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
                title={isMuted ? 'إلغاء كتم المايك' : 'كتم المايك'}
              >
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button
                onClick={toggleDeafen}
                className={`p-2 rounded-xl font-bold flex items-center justify-center transition-all ${
                  isDeafened
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                }`}
                title={isDeafened ? 'تشغيل صوت الآخرين' : 'كتم صوت الآخرين'}
              >
                {isDeafened ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>

            <div
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-white/5 cursor-pointer hover:bg-white/5 transition-colors flex-1 justify-center truncate"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${isSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-emerald-400'}`} />
              <span className="text-xs font-bold text-gray-300 truncate">
                فويس نشط ({totalConnected})
              </span>
              {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
            </div>

            <button
              onClick={leaveVoice}
              className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold transition-all shrink-0"
              title="مغادرة الفويس"
            >
              <PhoneOff size={16} />
            </button>
          </div>

          {/* Expanded Participant List */}
          {expanded && (
            <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {/* Local User */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  isSpeaking
                    ? 'bg-emerald-500/30 border border-emerald-400 text-emerald-200'
                    : 'bg-white/5 border border-white/10 text-gray-300'
                }`}
              >
                {isMuted ? <MicOff size={12} className="text-red-400" /> : <Mic size={12} className="text-emerald-400" />}
                <span className="truncate max-w-[80px]">{playerName} (أنت)</span>
              </div>

              {/* Remote Users */}
              {voiceUsers.map(u => (
                <div
                  key={u.peerId}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    u.isSpeaking
                      ? 'bg-emerald-500/30 border border-emerald-400 text-emerald-200 animate-pulse'
                      : 'bg-white/5 border border-white/10 text-gray-300'
                  }`}
                >
                  {u.isMuted ? <MicOff size={12} className="text-red-400" /> : <Mic size={12} className="text-emerald-400" />}
                  <span className="truncate max-w-[80px]">{u.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
