import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from '../../services/geminiService';
import FeatureWrapper from '../FeatureWrapper';
import Loader from '../Loader';
import { Chat } from '@google/genai';

type Tab = 'chat' | 'tts';
interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// FIX: Helper functions to convert raw PCM audio data into a playable WAV blob
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function pcmToWav(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): Blob {
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    const pcmAsUint8 = new Uint8Array(pcmData.buffer);
    for (let i = 0; i < dataSize; i++) {
        view.setUint8(44 + i, pcmAsUint8[i]);
    }

    return new Blob([view], { type: 'audio/wav' });
}


const ConversationHub: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  // Chatbot state
  const [chat, setChat] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // TTS state
  const [ttsInput, setTtsInput] = useState('Hello! I can read any text you provide.');
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const initializeChat = async () => {
        try {
            const chatInstance = await geminiService.createChat('You are a helpful and friendly AI assistant.');
            setChat(chatInstance);
            setChatHistory([{ role: 'model', text: 'Hello! How can I help you today?' }]);
        } catch (error) {
            console.error("Failed to initialize chat:", error);
            setChatHistory([{ role: 'model', text: 'Sorry, the chat service could not be started due to an API key error.' }]);
        }
    };
    initializeChat();
  }, []);
  
  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);


  const handleChatSend = async () => {
    if (!chatInput.trim() || !chat || isChatting) return;

    const userMessage: ChatMessage = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatting(true);

    try {
      const response = await chat.sendMessage({ message: chatInput });
      const modelMessage: ChatMessage = { role: 'model', text: response.text };
      setChatHistory(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error('Chat failed:', error);
      const errorMessage: ChatMessage = { role: 'model', text: 'Sorry, I encountered an error. Please try again.' };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleTtsGenerate = async () => {
    if (!ttsInput.trim() || isGeneratingSpeech) return;
    setIsGeneratingSpeech(true);
    setAudioUrl(null);
    try {
      const base64Audio = await geminiService.generateSpeech(ttsInput);
      
      const pcmData = decode(base64Audio);
      const audioBlob = pcmToWav(pcmData, 24000, 1, 16);
      
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } catch (error) {
      console.error('TTS generation failed:', error);
      alert('Failed to generate speech. See console for details.');
    } finally {
      setIsGeneratingSpeech(false);
    }
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'chat':
        return (
          <div className="flex flex-col h-[60vh] bg-gray-800 rounded-lg">
            <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-green-600' : 'bg-gray-700'}`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isChatting && <div className="flex justify-start"><div className="px-4 py-2 rounded-lg bg-gray-700"><Loader message="Typing..." /></div></div>}
            </div>
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                />
                <button onClick={handleChatSend} disabled={isChatting || !chatInput} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                  Send
                </button>
              </div>
            </div>
          </div>
        );
      case 'tts':
        return (
          <div className="space-y-4">
            <textarea
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition"
              rows={5}
              placeholder="Enter text to generate speech..."
              value={ttsInput}
              onChange={(e) => setTtsInput(e.target.value)}
            />
            <button onClick={handleTtsGenerate} disabled={isGeneratingSpeech || !ttsInput} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
              {isGeneratingSpeech ? 'Generating...' : 'Generate Speech'}
            </button>
            {isGeneratingSpeech && <Loader message="Crafting audio..." />}
            {audioUrl && (
              <div className="mt-4">
                <audio controls src={audioUrl} className="w-full"></audio>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <FeatureWrapper title="Conversation Hub" description="Engage in real-time chat, voice, and audio interactions." onBack={onBack}>
       <div className="w-full">
        <div className="mb-6 border-b border-gray-700">
          <nav className="-mb-px flex space-x-6">
            {(['chat', 'tts'] as Tab[]).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab ? 'border-green-500 text-green-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </nav>
        </div>
        <div>
          {renderTabContent()}
        </div>
      </div>
    </FeatureWrapper>
  );
};

export default ConversationHub;
