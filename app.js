const KEY_NAME = 'aurrexa_groq_key';
const chat = document.getElementById('chat');
const form = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const modal = document.getElementById('settingsModal');
const apiKeyInput = document.getElementById('apiKeyInput');

function openSettings() {
  if (!modal.open) modal.showModal();
  apiKeyInput.focus();
}

function addMessage(text, role, isError = false) {
  const node = document.createElement('div');
  node.className = `message ${role}${isError ? ' error' : ''}`;
  node.textContent = text;
  chat.appendChild(node);
  chat.scrollTop = chat.scrollHeight;
  return node;
}

document.getElementById('settingsButton').addEventListener('click', openSettings);
document.getElementById('cancelSettings').addEventListener('click', () => modal.close());

document.getElementById('settingsForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const value = apiKeyInput.value.trim();
  if (!value) {
    alert('Please enter an API Key');
    apiKeyInput.focus();
    return;
  }
  localStorage.setItem(KEY_NAME, value);
  alert('Key Saved');
  modal.close();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  const key = localStorage.getItem(KEY_NAME);
  if (!key) {
    alert('Please add API Key in Settings');
    openSettings();
    return;
  }

  addMessage(text, 'user');
  messageInput.value = '';
  sendButton.disabled = true;
  const pending = addMessage('Thinking…', 'assistant');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: text }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || `Request failed (${response.status})`);
    }
    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply.trim()) throw new Error('The API returned an empty response.');
    pending.textContent = reply;
  } catch (error) {
    pending.textContent = `Sorry, the request failed: ${error.message || 'Unknown error'}`;
    pending.classList.add('error');
  } finally {
    sendButton.disabled = false;
    messageInput.focus();
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
}

if (!localStorage.getItem(KEY_NAME)) {
  window.addEventListener('DOMContentLoaded', openSettings, { once: true });
}
