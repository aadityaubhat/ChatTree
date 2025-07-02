import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import './professional.css';

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
);

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  fontFamily: 'Inter, sans-serif',
  themeVariables: {
    primaryColor: '#ffffff',
    primaryTextColor: '#333333',
    primaryBorderColor: '#e0e0e0',
    lineColor: '#e0e0e0',
    secondaryColor: '#f1f0f0',
    tertiaryColor: '#f7f7f8'
  }
});

const TreeDiagram = ({ mermaidString }) => {
  const ref = useRef(null);

  useEffect(() => {
    const renderGraph = async () => {
      if (ref.current) {
        try {
          if (mermaidString) {
            const { svg } = await mermaid.render(`graph-${Date.now()}`, mermaidString);
            ref.current.innerHTML = svg;
          } else {
            ref.current.innerHTML = '';
          }
        } catch (error) {
          console.error('Mermaid rendering error:', error.message);
          // Don't display the broken SVG
          ref.current.innerHTML = '';
        }
      }
    };
    renderGraph();
  }, [mermaidString]);

  return <div ref={ref} className="mermaid-graph-container" />;
};

// Helper to compare message arrays
const areMessagesEqual = (a, b) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].content !== b[i].content || a[i].role !== b[i].role) {
      return false;
    }
  }
  return true;
};

function App() {
  const [threads, setThreads] = useState([[]]);
  const [currentThreadIndex, setCurrentThreadIndex] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [showRawMessages, setShowRawMessages] = useState(false);
  const [showTreeView, setShowTreeView] = useState(false);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [threads, currentThreadIndex]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    const userMessage = { role: 'user', content: newMessage, id: crypto.randomUUID() };

    const updatedThreads = threads.map((thread, index) =>
      index === currentThreadIndex ? [...thread, userMessage] : thread
    );

    setThreads(updatedThreads);
    setNewMessage('');

    try {
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedThreads[currentThreadIndex] }),
      });

      const data = await response.json();
      const botMessage = { role: 'assistant', content: data.message, id: crypto.randomUUID() };

      setThreads(prevThreads => prevThreads.map((thread, index) =>
        index === currentThreadIndex ? [...thread, botMessage] : thread
      ));
    } catch (error) {
      console.error('Error fetching from API:', error);
    }
  };

  const handleInlineEditChange = (content, messageIndex) => {
    setThreads(prevThreads => {
      const newThreads = [...prevThreads];
      const newThread = [...newThreads[currentThreadIndex]];
      newThread[messageIndex] = { ...newThread[messageIndex], content };
      newThreads[currentThreadIndex] = newThread;
      return newThreads;
    });
  };

  const handleInlineSend = async (messageIndex) => {
    const finalizedThreads = threads.map((thread, threadIdx) => {
      if (threadIdx === currentThreadIndex) {
        const newThread = [...thread];
        newThread[messageIndex] = { ...newThread[messageIndex], isEditing: false };
        return newThread;
      }
      return thread;
    });
    setThreads(finalizedThreads);

    try {
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: finalizedThreads[currentThreadIndex] }),
      });

      const data = await response.json();
      const botMessage = { role: 'assistant', content: data.message, id: crypto.randomUUID() };

      setThreads(prevThreads => prevThreads.map((thread, index) =>
        index === currentThreadIndex ? [...thread, botMessage] : thread
      ));
    } catch (error) {
      console.error('Error fetching from API:', error);
    }
  };

  const getSiblingBranches = (messageIndex) => {
    const currentThread = threads[currentThreadIndex];
    if (messageIndex >= currentThread.length || currentThread[messageIndex].role !== 'user') {
      return { siblingIndices: [], currentSiblingIndex: -1 };
    }

    const prefix = currentThread.slice(0, messageIndex);

    const siblingIndices = threads
      .map((_, i) => i)
      .filter(i => {
        const t = threads[i];
        if (t.length <= messageIndex || t[messageIndex].role !== 'user') {
          return false;
        }
        const tPrefix = t.slice(0, messageIndex);
        return areMessagesEqual(prefix, tPrefix);
      });

    const currentSiblingIndex = siblingIndices.indexOf(currentThreadIndex);
    return { siblingIndices, currentSiblingIndex };
  };

  const handleBranchNavigation = (messageIndex, direction) => {
    const { siblingIndices, currentSiblingIndex } = getSiblingBranches(messageIndex);
    const newSiblingIndex = currentSiblingIndex + direction;

    if (newSiblingIndex >= 0 && newSiblingIndex < siblingIndices.length) {
      setCurrentThreadIndex(siblingIndices[newSiblingIndex]);
    }
  };

  const handleNewBranch = (messageIndex) => {
    const currentThread = threads[currentThreadIndex];
    const branchPrefix = currentThread.slice(0, messageIndex);

    const existingEditingIndex = threads.findIndex(t =>
      t.length === branchPrefix.length + 1 &&
      t[t.length - 1].isEditing &&
      areMessagesEqual(t.slice(0, -1), branchPrefix)
    );

    if (existingEditingIndex !== -1) {
      setCurrentThreadIndex(existingEditingIndex);
    } else {
      const newThread = [...branchPrefix, { role: 'user', content: '', isEditing: true, id: crypto.randomUUID() }];
      const newThreadIndex = threads.length;
      setThreads(prevThreads => [...prevThreads, newThread]);
      setCurrentThreadIndex(newThreadIndex);
    }
  };

  const mermaidString = useMemo(() => {
    const nodes = new Map();
    const edges = new Set();

    threads.forEach(thread => {
      for (let i = 0; i < thread.length; i++) {
        const message = thread[i];
        if (message.isEditing) continue;
        nodes.set(message.id, message);
        if (i > 0) {
          const prevMessage = thread[i - 1];
          if (prevMessage.isEditing) continue;
          edges.add(`${prevMessage.id} --> ${message.id}`);
        }
      }
    });

    if (nodes.size === 0) return '';

    const nodeDefs = Array.from(nodes.entries()).map(([id, message]) => {
      const nodeId = `N${id.replace(/-/g, '')}`;
      const content = message.content.replace(/"/g, '#quot;').replace(/\n/g, '<br/>');
      const truncated = content.substring(0, 20) + (content.length > 20 ? '...' : '');
      const cssClass = message.role === 'user' ? 'user-node' : 'assistant-node';
      return `${nodeId}["${truncated}"]\nclass ${nodeId} ${cssClass}`;
    });

    const edgeDefs = Array.from(edges).map(edge => {
      const [source, target] = edge.split(' --> ');
      return `N${source.replace(/-/g, '')} --> N${target.replace(/-/g, '')}`;
    });

    return `graph TD\n${nodeDefs.join('\n')}\n${edgeDefs.join('\n')}`;
  }, [threads]);

  const isInlineEditing = threads[currentThreadIndex].some(m => m.isEditing);

  return (
    <div className="App">
      <div className="app-header">
        <h1>ChatTree</h1>
        <div className="header-buttons">
          <button
            onClick={() => setShowTreeView(s => !s)}
            className="toggle-raw-btn"
          >
            {showTreeView ? 'Hide' : 'Show'} Tree
          </button>
          <button
            onClick={() => setShowRawMessages(s => !s)}
            className="toggle-raw-btn"
          >
            {showRawMessages ? 'Hide' : 'Show'} Raw Messages
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className={`side-panel tree-view-container ${!showTreeView && 'hidden'}`}>
          {showTreeView && <TreeDiagram mermaidString={mermaidString} />}
        </div>
        <div className="chat-window" ref={chatWindowRef}>
          {threads[currentThreadIndex].map((message, index) => {
            const { siblingIndices, currentSiblingIndex } = getSiblingBranches(index);
            const hasLeft = currentSiblingIndex > 0;
            const hasRight = currentSiblingIndex < siblingIndices.length - 1;

            return (
              <div key={index} className={`message ${message.role}`}>
                {message.isEditing ? (
                  <div className="inline-edit-container">
                    <input
                      type="text"
                      value={message.content}
                      onChange={(e) => handleInlineEditChange(e.target.value, index)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && message.content.trim() !== '') {
                          handleInlineSend(index);
                        }
                      }}
                      placeholder="Send a new message"
                      autoFocus
                    />
                    <button onClick={() => handleInlineSend(index)} disabled={message.content.trim() === ''}>Send</button>
                  </div>
                ) : (
                  message.role === 'assistant'
                    ? <ReactMarkdown>{message.content}</ReactMarkdown>
                    : <p>{message.content}</p>
                )}

                {message.role === 'user' && (
                  <div className="branch-buttons">
                    <button onClick={() => handleBranchNavigation(index, -1)} disabled={!hasLeft} title="Previous branch">
                      <ChevronLeftIcon />
                    </button>
                    <span>{currentSiblingIndex + 1} / {siblingIndices.length}</span>
                    <button onClick={() => handleBranchNavigation(index, 1)} disabled={!hasRight} title="Next branch">
                      <ChevronRightIcon />
                    </button>
                    <button onClick={() => handleNewBranch(index)} className="new-branch-btn" title="New branch">
                      <PlusIcon />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className={`side-panel raw-messages-container ${!showRawMessages && 'hidden'}`}>
          {showRawMessages && (
            <>
              <h2>Current Thread</h2>
              <pre>
                {JSON.stringify(threads[currentThreadIndex].filter(m => !m.isEditing), null, 2)}
              </pre>
            </>
          )}
        </div>
      </div>

      <div className="input-area">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message here..."
          disabled={isInlineEditing}
        />
        <button onClick={handleSendMessage} disabled={isInlineEditing}>Send</button>
      </div>
    </div>
  );
}

export default App;
