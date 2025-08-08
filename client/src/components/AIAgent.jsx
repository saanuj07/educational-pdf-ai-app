import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faPaperPlane, 
  faSpinner, 
  faMicrophone, 
  faStop,
  faDownload,
  faExpand,
  faCompress,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import '../styles/ai-agent.css';

const AIAgent = ({ documentId, pdfData, onClose, isMinimized, onToggleMinimize }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [agentPersonality, setAgentPersonality] = useState('helpful');
  const [conversationMode, setConversationMode] = useState('chat');
  
  const messagesEndRef = useRef(null);
  const speechRecognition = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize AI Agent with welcome message
  useEffect(() => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'agent',
      content: `Hello! I'm your AI Learning Assistant 🤖\n\nI can help you with:\n• 📖 Analyze and explain your PDF content\n• ❓ Answer questions about the document\n• 📝 Create study materials (summaries, flashcards, quizzes)\n• 🎧 Generate interactive podcasts\n• 💡 Provide learning insights and tips\n\nWhat would you like to explore today?`,
      timestamp: new Date(),
      suggestions: [
        "Summarize this document",
        "Create study questions",
        "Explain complex concepts",
        "Generate flashcards"
      ]
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      speechRecognition.current = new SpeechRecognition();
      speechRecognition.current.continuous = false;
      speechRecognition.current.interimResults = false;
      speechRecognition.current.lang = 'en-US';

      speechRecognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      speechRecognition.current.onerror = () => {
        setIsListening(false);
      };

      speechRecognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Temporarily use the existing chat endpoint as a workaround
      const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: documentId,
          question: `[AI Agent - ${agentPersonality} mode] ${userMessage.content}`
        })
      });

      if (response.ok) {
        const chatResponse = await response.json();
        
        const agentMessage = {
          id: Date.now() + 1,
          type: 'agent',
          content: chatResponse.answer || 'I understand your question. Let me help you with that!',
          timestamp: new Date(),
          suggestions: ['Tell me more', 'Explain this topic', 'Create a summary'],
          actions: [],
          confidence: 0.8
        };

        setMessages(prev => [...prev, agentMessage]);
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('AI Agent error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'agent',
        content: "I apologize, but I'm having trouble connecting to my AI services right now. Please try again in a moment, or you can still use the other features of the app!",
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const handleActionClick = async (action) => {
    setIsLoading(true);
    try {
      switch (action.type) {
        case 'generate_summary':
          // Trigger summary generation
          window.dispatchEvent(new CustomEvent('ai-agent-action', { 
            detail: { action: 'summary', documentId } 
          }));
          break;
        case 'create_flashcards':
          // Trigger flashcard generation
          window.dispatchEvent(new CustomEvent('ai-agent-action', { 
            detail: { action: 'flashcards', documentId } 
          }));
          break;
        case 'generate_quiz':
          // Trigger quiz generation
          window.dispatchEvent(new CustomEvent('ai-agent-action', { 
            detail: { action: 'quiz', documentId } 
          }));
          break;
        case 'create_podcast':
          // Trigger podcast generation
          window.dispatchEvent(new CustomEvent('ai-agent-action', { 
            detail: { action: 'podcast', documentId } 
          }));
          break;
        default:
          console.log('Unknown action:', action);
      }
    } catch (error) {
      console.error('Action error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if (speechRecognition.current && !isListening) {
      setIsListening(true);
      speechRecognition.current.start();
    }
  };

  const stopListening = () => {
    if (speechRecognition.current && isListening) {
      speechRecognition.current.stop();
      setIsListening(false);
    }
  };

  const exportConversation = () => {
    const conversationText = messages
      .map(msg => `[${msg.timestamp.toLocaleTimeString()}] ${msg.type.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-conversation-${documentId || 'session'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearConversation = () => {
    if (window.confirm('Are you sure you want to clear the conversation?')) {
      setMessages([]);
    }
  };

  if (isMinimized) {
    return (
      <div className="ai-agent-minimized" onClick={onToggleMinimize}>
        <FontAwesomeIcon icon={faRobot} className="agent-icon" />
        <span className="agent-label">AI Assistant</span>
        {messages.length > 1 && (
          <span className="message-count">{messages.length - 1}</span>
        )}
      </div>
    );
  }

  return (
    <div className="ai-agent-container">
      {/* Header */}
      <div className="agent-header">
        <div className="agent-info">
          <FontAwesomeIcon icon={faRobot} className="agent-avatar" />
          <div className="agent-details">
            <h3>AI Learning Assistant</h3>
            <p className="agent-status">
              {isLoading ? 'Thinking...' : 'Ready to help'}
            </p>
          </div>
        </div>
        
        <div className="agent-controls">
          <button 
            className="control-btn"
            onClick={exportConversation}
            title="Export conversation"
          >
            <FontAwesomeIcon icon={faDownload} />
          </button>
          
          <button 
            className="control-btn"
            onClick={clearConversation}
            title="Clear conversation"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
          
          <button 
            className="control-btn"
            onClick={onToggleMinimize}
            title="Minimize"
          >
            <FontAwesomeIcon icon={faCompress} />
          </button>
          
          <button 
            className="control-btn close-btn"
            onClick={onClose}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="agent-settings">
        <div className="setting-group">
          <label>Personality:</label>
          <select 
            value={agentPersonality} 
            onChange={(e) => setAgentPersonality(e.target.value)}
            className="setting-select"
          >
            <option value="helpful">Helpful & Friendly</option>
            <option value="academic">Academic & Formal</option>
            <option value="casual">Casual & Relaxed</option>
            <option value="encouraging">Encouraging & Motivating</option>
          </select>
        </div>
        
        <div className="setting-group">
          <label>Mode:</label>
          <select 
            value={conversationMode} 
            onChange={(e) => setConversationMode(e.target.value)}
            className="setting-select"
          >
            <option value="chat">General Chat</option>
            <option value="tutor">Tutoring Mode</option>
            <option value="quiz">Quiz Master</option>
            <option value="study">Study Buddy</option>
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container" ref={chatContainerRef}>
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}-message`}>
            <div className="message-content">
              {message.type === 'agent' && (
                <FontAwesomeIcon icon={faRobot} className="message-avatar" />
              )}
              
              <div className="message-body">
                <div className="message-text">
                  {message.content.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
                
                {message.confidence && (
                  <div className="confidence-indicator">
                    Confidence: {Math.round(message.confidence * 100)}%
                  </div>
                )}
                
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="suggestions">
                    <p className="suggestions-label">Try asking:</p>
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="suggestion-btn"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                
                {message.actions && message.actions.length > 0 && (
                  <div className="actions">
                    <p className="actions-label">Quick actions:</p>
                    {message.actions.map((action, index) => (
                      <button
                        key={index}
                        className="action-btn"
                        onClick={() => handleActionClick(action)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <span className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message agent-message">
            <div className="message-content">
              <FontAwesomeIcon icon={faRobot} className="message-avatar" />
              <div className="message-body">
                <div className="typing-indicator">
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="input-container">
        <div className="input-wrapper">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me anything about your document..."
            className="message-input"
            disabled={isLoading}
          />
          
          <div className="input-controls">
            {speechRecognition.current && (
              <button
                className={`voice-btn ${isListening ? 'listening' : ''}`}
                onClick={isListening ? stopListening : startListening}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                <FontAwesomeIcon icon={isListening ? faStop : faMicrophone} />
              </button>
            )}
            
            <button
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              title="Send message"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgent;
