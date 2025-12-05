'use client';

import React, {useEffect, useRef, useState} from 'react';
import {BookOpen, ChevronUp, LayoutDashboard, MessageSquare, Minimize2, Send, X} from 'lucide-react';
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';

// Mock 24-hour turbidity data for demonstration purposes
const turbidityData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  turbidity: Math.random() * 5 + 2 + Math.sin(i / 3) * 2,
}));

// Define the types for output methods and message structure.
type OutputMethod = 'text' | 'audio' | 'video';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  outputMethod?: OutputMethod;
  isLoading?: boolean;
  audioPlaying?: boolean;
}

const AquaGuardChatbot = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [outputMethod, setOutputMethod] = useState<OutputMethod>('text');
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  // Effect to automatically scroll to the latest message.
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to show a welcome message when the chat is opened for the first time.
  useEffect(() => {
    if (isChatOpen && messages.length === 0) {
      setTimeout(() => {
        setMessages([
          {
            role: 'assistant',
            content: 'Hello! I\'m Aqua, your water quality assistant. How can I help you today?',
          },
        ]);
      }, 500);
    }
  }, [isChatOpen]);

  const handleChatToggle = () => {
    if (isMinimized) {
      setIsMinimized(false);
    }
    setIsChatOpen(!isChatOpen);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsChatOpen(false);
  };

  const handleClose = () => {
    setIsChatOpen(false);
    setIsMinimized(false);
    setMessages([]); // Clear chat history on close.
  };

  const callOpenAI = async (userMessage: string, method: OutputMethod) => {
    // IMPORTANT: Please replace your API Key in the .env.local file before running the project
    const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    try {
      if (method === 'text') {
        // Standard text generation using gpt-4o-mini
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are Aqua, a helpful water quality monitoring assistant. Provide concise and helpful answers about water quality, turbidity, and related topics.',
              },
              { role: 'user', content: userMessage },
            ],
          }),
        });

        const data = await response.json();
        return data.choices[0].message.content;

      } else if (method === 'audio') {
        // Generate text content based on the user's message and the provided image
        const textResp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: 'system', content: 'You are Aqua, a helpful water quality assistant.' },
              { role: 'user', content: userMessage }
            ],
          }),
        });

        const textData = await textResp.json();
        const assistantText = textData.choices[0].message.content;

        // Use the generated text as input for the Text-to-Speech (TTS) model.
        const ttsResp = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini-tts",
            input: assistantText,
            voice: "alloy",
          }),
        });

        const audioBlob = await ttsResp.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        // Play the audio automatically
        const audio = new Audio(audioUrl);
        await audio.play();

        // Return the generated text to be displayed in the chat
        return assistantText;

      } else if (method === 'video') {
        // IMPORTANT: You need to verify your organisation in OpenAI Platform in order to access video model
        // Video generation is an asynchronous process that requires polling
        // 1. Initiate the video generation job
        const createResp = await fetch('https://api.openai.com/v1/videos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model: 'sora-2',
            prompt: userMessage,
            size: '1280x720',
            seconds: '4',
          }),
        });

        if (!createResp.ok) {
          const err = await createResp.json();
          console.error('Sora create error', err);
          return `Error creating video: ${err.error?.message || createResp.statusText}`;
        }

        const job = await createResp.json();
        const videoId = job.id;
        console.log('Video job created:', job);

        // 2. Poll for the job status
        let status = job;
        while (status.status === 'queued' || status.status === 'in_progress') {
          await new Promise((r) => setTimeout(r, 2000)); // Check every 2 seconds
          const statusResp = await fetch(`https://api.openai.com/v1/videos/${videoId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
            },
          });
          status = await statusResp.json();
          console.log('Video status:', status.status, 'progress:', status.progress);
        }

        // 3. Check the final status and return the result
        if (status.status === 'completed' && status.output?.url) {
          const videoUrl = status.output.url;
          console.log('Video generated:', videoUrl);

          return videoUrl;
        } else {
          console.error('Video generation failed:', status);
          return `Video generation failed: ${status.status}`;
        }
      }
    } catch (error) {
      console.error('API Error:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      outputMethod,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');

    // Display a loading state for the assistant's response
    const loadingMessage: Message = {
      role: 'assistant',
      content: '',
      outputMethod,
      isLoading: true,
      audioPlaying: outputMethod === 'audio',
    };

    setMessages((prev) => [...prev, loadingMessage]);

    // Call the API and get the response
    const response = await callOpenAI(inputMessage, outputMethod);

    // Update the loading message with the actual response
    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[newMessages.length - 1] = {
        role: 'assistant',
        content: response,
        outputMethod,
        isLoading: false,
        audioPlaying: false,
      };
      return newMessages;
    });
  };

  const renderMessageContent = (message: Message) => {
    // User messages are always displayed as plain text
    if (message.role === 'user') {
      return <p className="whitespace-pre-wrap">{message.content}</p>;
    }

    // The following logic handles rendering for assistant messages
    if (message.isLoading) {
      if (message.outputMethod === 'text') {
        return (
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
        );
      }
      if (message.outputMethod === 'audio') {
        return (
            <div className="text-4xl animate-pulse">
              🔊
            </div>
        );
      }
      if (message.outputMethod === 'video') {
        return (
            <div className="w-64 h-48 bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
      }
    }

    // Render the final content after loading is complete
    if (message.outputMethod === 'video' && message.content) {
      return (
          <div className="w-64 h-48 bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
            <video className="w-full h-full rounded-lg object-cover" controls autoPlay loop>
              <source src={message.content} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
      );
    }

    // For 'text' and 'audio' types, display the text content
    // The audio playback is handled by `callOpenAI`, not here
    return <p className="whitespace-pre-wrap">{message.content}</p>;
  };

  // --- JSX for the component ---
  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        {/* Navigation Bar */}
        <nav className="bg-white shadow-md px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              AquaGuard
            </h1>
            <div className="flex-1"></div>
            <div className="flex gap-6">
              <button className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
                <LayoutDashboard size={20} />
                <span className="font-medium">Dashboard</span>
              </button>
              <button className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
                <BookOpen size={20} />
                <span className="font-medium">Guide</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="p-8 flex gap-4">
          {/* Chart Section */}
          <div
              className={`bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 ${
                  isChatOpen ? 'w-2/3' : 'w-full'
              }`}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">24-Hour Turbidity Monitor</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={turbidityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis label={{ value: 'Turbidity (NTU)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)} NTU`, 'Turbidity']}
                    labelFormatter={(label) => `Time: ${label}`}
                />
                <Line
                    type="monotone"
                    dataKey="turbidity"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chat Panel */}
          {isChatOpen && (
              <div className="w-1/3 bg-white rounded-2xl shadow-lg flex flex-col animate-in slide-in-from-right duration-300">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-xl font-bold text-gray-800">Chat with Aqua</h3>
                  <div className="flex gap-2">
                    <button
                        onClick={handleMinimize}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Minimize2 size={18} />
                    </button>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message, index) => (
                      <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                message.role === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {renderMessageContent(message)}
                        </div>
                      </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    {/* Method Selector */}
                    <div className="relative">
                      <button
                          onClick={() => setShowMethodSelector(!showMethodSelector)}
                          className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <ChevronUp size={20} className={showMethodSelector ? 'rotate-180 transition-transform' : 'transition-transform'} />
                      </button>
                      {showMethodSelector && (
                          <div className="absolute bottom-full left-0 mb-2 bg-white shadow-lg rounded-lg p-2 space-y-1">
                            <button
                                onClick={() => {
                                  setOutputMethod('text');
                                  setShowMethodSelector(false);
                                }}
                                className={`w-full px-4 py-2 rounded-lg text-left hover:bg-gray-100 ${
                                    outputMethod === 'text' ? 'bg-blue-100 text-blue-600' : ''
                                }`}
                            >
                              📝 Text
                            </button>
                            <button
                                onClick={() => {
                                  setOutputMethod('audio');
                                  setShowMethodSelector(false);
                                }}
                                className={`w-full px-4 py-2 rounded-lg text-left hover:bg-gray-100 ${
                                    outputMethod === 'audio' ? 'bg-blue-100 text-blue-600' : ''
                                }`}
                            >
                              🔊 Audio
                            </button>
                            <button
                                onClick={() => {
                                  setOutputMethod('video');
                                  setShowMethodSelector(false);
                                }}
                                className={`w-full px-4 py-2 rounded-lg text-left hover:bg-gray-100 ${
                                    outputMethod === 'video' ? 'bg-blue-100 text-blue-600' : ''
                                }`}
                            >
                              🎥 Video
                            </button>
                          </div>
                      )}
                    </div>

                    {/* Input Field */}
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Send Button */}
                    <button
                        onClick={handleSendMessage}
                        className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </div>
          )}
        </div>

        {/* Floating Chat Button */}
        {!isChatOpen && (
            <button
                onClick={handleChatToggle}
                className={`fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all ${
                    isMinimized ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                } animate-pulse`}
            >
              <MessageSquare size={28} className="text-white" />
            </button>
        )}
      </div>
  );
};

export default AquaGuardChatbot;