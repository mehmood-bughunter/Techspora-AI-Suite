import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GoogleGenAI, LiveSession } from '@google/genai';
import { MicIcon, StopIcon, UserIcon, BotIcon } from './Icons';
import { connectLiveSession, decode, decodeAudioData, createBlob } from '../services/geminiService';
import type { TranscriptEntry } from '../types';

export const LiveConversation: React.FC = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const stopSession = useCallback(() => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close();
        outputAudioContextRef.current = null;
    }
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    setIsSessionActive(false);
  }, []);

  const handleMessage = useCallback(async (message: any) => {
    if (message.serverContent) {
        if (message.serverContent.inputTranscription) {
            const { text, isFinal } = message.serverContent.inputTranscription;
            currentInputTranscriptionRef.current += text;
            setTranscripts(prev => {
                const last = prev[prev.length - 1];
                if (last?.speaker === 'user' && !last.isFinal) {
                    const newTranscripts = [...prev.slice(0, -1)];
                    newTranscripts.push({ speaker: 'user', text: currentInputTranscriptionRef.current, isFinal });
                    return newTranscripts;
                }
                return [...prev, { speaker: 'user', text: currentInputTranscriptionRef.current, isFinal }];
            });
        }
        if (message.serverContent.outputTranscription) {
            const { text, isFinal } = message.serverContent.outputTranscription;
            currentOutputTranscriptionRef.current += text;
             setTranscripts(prev => {
                const last = prev[prev.length - 1];
                if (last?.speaker === 'model' && !last.isFinal) {
                    const newTranscripts = [...prev.slice(0, -1)];
                    newTranscripts.push({ speaker: 'model', text: currentOutputTranscriptionRef.current, isFinal });
                    return newTranscripts;
                }
                return [...prev, { speaker: 'model', text: currentOutputTranscriptionRef.current, isFinal }];
            });
        }
        if (message.serverContent.turnComplete) {
            currentInputTranscriptionRef.current = '';
            currentOutputTranscriptionRef.current = '';
        }
        if (message.serverContent.modelTurn?.parts[0]?.inlineData?.data) {
            const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
            if (outputAudioContextRef.current) {
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContextRef.current.destination);
                
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;

                audioSourcesRef.current.add(source);
                source.onended = () => {
                    audioSourcesRef.current.delete(source);
                };
            }
        }
    }
  }, []);

  const startSession = async () => {
    setError(null);
    setTranscripts([]);
    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsSessionActive(true);
      
      // FIX: Cast window to `any` to allow access to webkitAudioContext for broader browser compatibility.
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      sessionPromiseRef.current = connectLiveSession({
        onmessage: handleMessage,
        onerror: (err: any) => {
            console.error('Session error:', err);
            setError('An error occurred during the session.');
            stopSession();
        },
        onclose: () => {
            console.log('Session closed.');
            stopSession();
        }
      });

      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const pcmBlob = createBlob(inputData);
          if (sessionPromiseRef.current) {
              sessionPromiseRef.current.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
          }
      };

      source.connect(scriptProcessorRef.current);
      scriptProcessorRef.current.connect(audioContextRef.current.destination);

    } catch (err) {
      console.error('Failed to start session:', err);
      setError('Could not access microphone. Please grant permission and try again.');
      setIsSessionActive(false);
    }
  };
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);


  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700/50">
      <div className="flex flex-col items-center">
        {!isSessionActive ? (
          <button
            onClick={startSession}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-green-500 text-white font-bold rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
          >
            <MicIcon className="w-6 h-6" />
            Start Conversation
          </button>
        ) : (
          <button
            onClick={stopSession}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-red-500 text-white font-bold rounded-full shadow-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
          >
            <StopIcon className="w-6 h-6" />
            End Conversation
          </button>
        )}
         {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
      </div>

      <div className="mt-6 h-80 bg-gray-900 rounded-lg p-4 overflow-y-auto space-y-4 border border-gray-700">
        {transcripts.length === 0 && !isSessionActive && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MicIcon className="w-16 h-16 mb-4"/>
            <p className="text-lg">Click "Start Conversation" to begin.</p>
            <p>Your conversation transcript will appear here.</p>
          </div>
        )}
        {isSessionActive && transcripts.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-green-400 animate-pulse">
                <MicIcon className="w-16 h-16 mb-4"/>
                <p className="text-lg">Listening...</p>
             </div>
        )}
        {transcripts.map((entry, index) => (
          <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
            {entry.speaker === 'model' && <BotIcon className="w-6 h-6 flex-shrink-0 text-green-400 mt-1" />}
            <div className={`max-w-md p-3 rounded-lg ${entry.speaker === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
              <p className={`text-white ${!entry.isFinal ? 'opacity-70' : ''}`}>{entry.text}</p>
            </div>
            {entry.speaker === 'user' && <UserIcon className="w-6 h-6 flex-shrink-0 text-blue-400 mt-1" />}
          </div>
        ))}
      </div>
    </div>
  );
};