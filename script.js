function loadSettings() {
  const key = localStorage.getItem('apiKey');
  if (key) document.getElementById('apiKey').value = key;

  const stored = localStorage.getItem('model');
  const allowed = ['o3', 'gpt-4.5-preview'];
  const model = allowed.includes(stored) ? stored : 'o3';
  document.getElementById('model').value = model;
}

function loadConversation() {
  const conv = localStorage.getItem('conversation');
  return conv ? JSON.parse(conv) : [];
}

function saveConversation(conv) {
  localStorage.setItem('conversation', JSON.stringify(conv));
}

function renderConversation() {
  const chat = document.getElementById('chat');
  chat.innerHTML = '';
  const conv = loadConversation();
  conv.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'message ' + msg.role;
    const label = msg.role === 'user' ? 'You said:' : 'Chatgpt said:';
    div.textContent = label + ' ' + msg.content;
    chat.appendChild(div);
  });
  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
  const apiKey = document.getElementById('apiKey').value.trim();
  if (!apiKey) {
    alert('Please set your API key.');
    return;
  }
  const model = document.getElementById('model').value;
  localStorage.setItem('apiKey', apiKey);
  localStorage.setItem('model', model);

  const conv = loadConversation();
  const content = document.getElementById('userInput').value.trim();
  if (!content) return;
  conv.push({ role: 'user', content });
  document.getElementById('userInput').value = '';
  renderConversation();
  saveConversation(conv);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model,
      messages: conv
    })
  });
  const data = await res.json();
  if (data.error) {
    alert(data.error.message);
    return;
  }
  const reply = data.choices[0].message.content;
  conv.push({ role: 'assistant', content: reply });
  saveConversation(conv);
  renderConversation();
}

function clearConversation() {
  localStorage.removeItem('conversation');
  renderConversation();
}

function downloadConversation() {
  const conv = loadConversation();
  const blob = new Blob([JSON.stringify(conv, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'conversation.json';
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('saveKey').addEventListener('click', () => {
  const key = document.getElementById('apiKey').value.trim();
  localStorage.setItem('apiKey', key);
});

document.getElementById('send').addEventListener('click', sendMessage);

document.getElementById('clear').addEventListener('click', clearConversation);

document.getElementById('download').addEventListener('click', downloadConversation);

loadSettings();
renderConversation();
