const KEY_NAME = 'aurrexa_groq_key';
const chat = document.getElementById('chat');
const form = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const modal = document.getElementById('settingsModal');
const apiKeyInput = document.getElementById('apiKeyInput');

// Cache clear on load - IMPORTANT
if ('caches' in window) {
  caches.keys().then(names => names.forEach(name => caches.delete(name)));
}

function openSettings() {
  if (!modal.open) modal.showModal();
  apiKeyInput.value = localStorage.getItem(KEY_NAME) || '';
  apiKeyInput.focus();
}

function addMessage(text, role, isError = false) {
  const node = document.createElement('div');
  node.className = `message ${role}${isError? ' error' : ''}`;
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
  if (!value.startsWith('gsk_')) {
    alert('Key gsk_ se start honi chahiye!');
    return;
  }
  localStorage.setItem(KEY_NAME, value);
  alert('Key Saved! Ab chat karo');
  modal.close();
  location.reload();
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
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: text }],
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || `Request failed (${response.status})`);
    }
    const reply = data?.choices?.[0]?.message?.content;
    pending.textContent = reply || 'Empty response';
  } catch (error) {
    pending.textContent = `Error: ${error.message}`;
    pending.classList.add('error');
  } finally {
    sendButton.disabled = false;
    messageInput.focus();
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
  });
}

if (!localStorage.getItem(KEY_NAME)) {
  window.addEventListener('DOMContentLoaded', openSettings, { once: true });
}
