require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
        const stream = await openai.chat.completions.create({
            model: 'gpt-4.1-nano',
            messages: messages,
            stream: true,
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }
        res.write('data: [DONE]\n\n');
    } catch (error) {
        console.error('Error streaming from OpenAI:', error);
        res.write(`data: ${JSON.stringify({ error: 'An error occurred.' })}\n\n`);
        res.status(500);
    } finally {
        res.end();
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 