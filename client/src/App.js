import React, { useState } from 'react';
import './App.css';

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

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    const userMessage = { role: 'user', content: newMessage };

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
      const botMessage = { role: 'assistant', content: data.message };

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
      const botMessage = { role: 'assistant', content: data.message };

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
      const newThread = [...branchPrefix, { role: 'user', content: '', isEditing: true }];
      const newThreadIndex = threads.length;
      setThreads(prevThreads => [...prevThreads, newThread]);
      setCurrentThreadIndex(newThreadIndex);
    }
  };

  const isInlineEditing = threads[currentThreadIndex].some(m => m.isEditing);

  return (
    <div className="App">
      <div className="chat-window">
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
                <p>{message.content}</p>
              )}

              {message.role === 'user' && (
                <div className="branch-buttons">
                  <button onClick={() => handleBranchNavigation(index, -1)} disabled={!hasLeft}>
                    &larr;
                  </button>
                  <span>{currentSiblingIndex + 1} / {siblingIndices.length}</span>
                  <button onClick={() => handleBranchNavigation(index, 1)} disabled={!hasRight}>
                    &rarr;
                  </button>
                  <button onClick={() => handleNewBranch(index)} style={{ marginLeft: '10px' }} >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
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
