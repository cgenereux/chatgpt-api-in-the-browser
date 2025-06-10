function loadSettings() {
  const key = localStorage.getItem('apiKey');
  if (key) document.getElementById('apiKey').value = key;

  const stored = localStorage.getItem('model');
  const allowed = ['o3', 'gpt-4.5-preview', 'o3-pro'];
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
    const label = msg.role === 'user' ? 'I said:' : 'ChatGPT said:';
    div.textContent = label + '\n' + msg.content;
    chat.appendChild(div);
  });
  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
    // ... (setup code omitted for brevity)

    let endpoint, body;
    if (model === 'o3-pro') {
        // Use Responses API for o3-pro (completions style prompt)
        const prompt = conv.map(m => 
            (m.role === 'user' ? 'User: ' : 'Assistant: ') + m.content
        ).join('\n') + '\nAssistant: ';
        endpoint = 'https://api.openai.com/v1/responses';
        body = {
            model: 'o3-pro',
            prompt: prompt,
            max_tokens: 512,
            temperature: 0.7
        };
    } else {
        // Use Chat Completions API for other models
        endpoint = 'https://api.openai.com/v1/chat/completions';
        body = {
            model: model,
            messages: conv   // conversation array
        };
    }

    const res = await fetch(endpoint, { method: 'POST', headers: { ... }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.error) {
        alert(data.error.message);
        return;
    }
    // Extract the assistant reply from the response:
    const reply = (model === 'o3-pro') 
        ? data.choices[0].text 
        : data.choices[0].message.content;
    // ... (save and render reply)
}

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (data.error) {
    alert(data.error.message);
    return;
  }

  const reply = model === 'o3-pro'
    ? data.choices[0].text
    : data.choices[0].message.content;

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
