(() => {
  const chatBox      = document.getElementById('chat')
  const chatForm     = document.getElementById('chat-form')
  const chatInput    = document.getElementById('chat-input')
  const keyForm      = document.getElementById('key-form')
  const keyInput     = document.getElementById('api-key-input')
  const modelSelect  = document.getElementById('model-select')

  let apiKey = localStorage.getItem('api-key') || ''
  let conv   = []

  if (apiKey) {
    keyInput.value = apiKey
    keyForm.style.display = 'none'
  } else {
    chatForm.style.display = 'none'
  }

  keyForm.addEventListener('submit', e => {
    e.preventDefault()
    apiKey = keyInput.value.trim()
    if (!apiKey) {
      alert('Please enter your OpenAI API key.')
      return
    }
    localStorage.setItem('api-key', apiKey)
    keyForm.style.display = 'none'
    chatForm.style.display = ''
  })

  chatForm.addEventListener('submit', async e => {
    e.preventDefault()
    const userMsg = chatInput.value.trim()
    if (!userMsg) return

    append('user', userMsg)
    chatInput.value = ''

    const model = modelSelect.value
    let endpoint = 'https://api.openai.com/v1/chat/completions'
    let body

    if (model === 'o3-pro') {
      endpoint = 'https://api.openai.com/v1/responses'
      const prompt = conv
        .map(m => (m.role === 'user' ? 'User: ' : 'Assistant: ') + m.content)
        .join('\n') + '\nAssistant: '
      body = {
        model,
        prompt,
        max_tokens: 512,
        temperature: 0.7
      }
    } else {
      body = {
        model,
        messages: conv.map(m => ({ role: m.role, content: m.content }))
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.error) {
        append('error', data.error.message)
        return
      }
      const text = model === 'o3-pro'
        ? data.choices[0].text
        : data.choices[0].message.content
      append('assistant', text)
    } catch (err) {
      append('error', err.message)
    }
  })

  function append(role, content) {
    conv.push({ role, content })
    const p = document.createElement('p')
    p.className = role
    p.textContent = content
    chatBox.appendChild(p)
    chatBox.scrollTop = chatBox.scrollHeight
  }
})()
