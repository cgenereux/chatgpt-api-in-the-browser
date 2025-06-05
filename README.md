# ChatGPT API in the Browser

This project provides a simple web interface for talking to OpenAI's models using your own API key. The page stores your key and conversation history in your browser's `localStorage` so it persists between visits.

## Usage

1. Open `index.html` in a modern web browser.
2. Enter your OpenAI API key and click **Save**.
3. Choose a model (`o3` or `gpt-4.5-preview`) and start chatting.
4. Your conversation is stored locally (in your browser cache) and can be cleared or downloaded as JSON.

**Security note:** your API key is stored in plain text in your browser's storage. Do not use this on shared or untrusted computers.

### Hosting with GitHub Pages

This site works without a backend, so you can host it on GitHub Pages:

1. Push the files in this repository to a public GitHub repo.
2. In the repo settings, enable GitHub Pages and choose the root directory.
   A `.nojekyll` file is included so the site is served as plain HTML/JS.
3. To automate deployment, use the workflow in `.github/workflows/pages.yml`.
   It publishes the site whenever changes are pushed to `main`.
4. Visit the provided URL to use your hosted ChatGPT client.
