# 🌳 ChatTree

**ChatTree** is a proof-of-concept (POC) chat interface that enables **non-linear conversations** — allowing users to branch off and explore alternate threads from any user message. It reimagines how we interact with AI by letting conversations evolve as a tree rather than a thread.

Instead of a single linear chat thread, you get a **conversation tree** — ideal for managing context.
---

## 🧠 Why ChatTree?

This POC explores a fundamental limitation in traditional chats: they are linear. But real-world thought processes aren't.

Users often need to:
- Ask multiple follow-ups about the same step
- Revisit earlier parts of a conversation
- Explore alternate what-if scenarios  
- Skip ahead or go back without losing context

**ChatTree** introduces:
- 📍 **Branching from any user message**
- 📚 **Context engineering** to isolate relevant context
- 🔄 **Toggle controls** to navigate thread branches

---

## 🧪 This is a POC

> This project is an **exploratory prototype**, not a production-ready system.

It's built to:
- Test interaction ideas for non-linear chat
- Explore context engineering principles
- Gather feedback on branching UX patterns
- Serve as a foundation for future experiments (multi-agent, collaborative chat, etc.)

---

## 🔍 Context Engineering

In modern AI usage, **context engineering** not just prompt engineering is emerging as the core challenge.

> "+" for "'context engineering'" over "'prompt engineering' ...  
> filling the context window with just the right information for the next step."  
> — Andrej Karpathy

In ChatTree, when a user starts a new branch, the app suppresses future messages from the original thread and allows a new subthread to form — **modifying the visible context** and simplifying reasoning for both user and bot.

This aligns with Karpathy's philosophy that **curating the right context window** (past dialogue, instructions, history) is critical for effective AI interactions.

---

## 📸 Demo Example

<Add gif>

[![Watch the video](/chattree_demo.png)](https://youtu.be/OfGPAeIrEAM)



---

## Running Locally

To run the ChatTree prototype on your local machine, follow these steps:

### 1. Set Up the Server

The server handles the secure communication with the OpenAI API.

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```
2.  **Create an environment file:** Create a file named `.env` in the `server` directory and add your OpenAI API key:
    ```
    OPENAI_API_KEY=your_openai_api_key_here
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Start the server:**
    ```bash
    npm start
    ```
The server will be running on `http://localhost:5001`.

### 2. Set Up the Client

The client is the React-based user interface for ChatTree.

1.  **Navigate to the client directory:**
    ```bash
    cd client
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start the client:**
    ```bash
    npm start
    ```

The client application will open automatically in your browser at `http://localhost:3000`.