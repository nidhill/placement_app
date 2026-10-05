// The AI behind the student Resume Agent. The model call lives here, on the
// server, because a key shipped to the browser (VITE_GROQ_API_KEY) is readable
// by anyone who opens the page and can be spent by anyone who copies it.
// The client sends a prompt; this returns the model's text.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const MAX_PROMPT = 24000;

function isConfigured() {
    return !!process.env.GROQ_API_KEY;
}

async function complete(prompt) {
    if (!isConfigured()) {
        const err = new Error('The resume assistant is not configured yet. Ask an admin to add the AI key.');
        err.status = 503;
        throw err;
    }
    const text = String(prompt || '').slice(0, MAX_PROMPT);
    if (!text.trim()) {
        const err = new Error('Nothing to send to the assistant');
        err.status = 400;
        throw err;
    }

    const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
            model: MODEL,
            messages: [{ role: 'user', content: text }],
            temperature: 0.1,
            response_format: { type: 'json_object' },
        }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data?.error?.message || `AI request failed (${res.status})`);
        err.status = res.status === 429 ? 429 : 502;
        throw err;
    }
    return data?.choices?.[0]?.message?.content?.trim() || '';
}

module.exports = { complete, isConfigured };
