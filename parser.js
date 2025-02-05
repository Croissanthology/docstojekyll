// parser.js
function sanitizeText(text) {
  // handle quotes in title/content
  return text?.replace(/"/g, '\"') || '';
}

function getMarkdownContent() {
  try {
    // more robust selectors
    const editor = document.querySelector('#kix-appview, .kix-appview-editor');
    if (!editor) {
      console.error('Editor not found');
      return null;
    }

    // defensive metadata extraction
    const title = sanitizeText(
      document.querySelector('[data-heading="TITLE"]')?.innerText || 
      document.title || 
      'Untitled'
    );
    
    const date = new Date().toISOString().split('T')[0];
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // better slug sanitization
      .replace(/^-+|-+$/g, ''); // trim dashes

    const frontmatter = `---
layout: post
title: "${title}"
date: ${date}
permalink: /${slug}
---

`;

    // handle empty content case
    const content = sanitizeText(editor.innerText);
    if (!content) {
      console.error('No content found');
      return null;
    }

    return frontmatter + content;
  } catch (err) {
    console.error('Error parsing document:', err);
    return null;
  }
}

// create UI with error handling
function createButton() {
  const existingButton = document.getElementById('jekyll-convert-btn');
  if (existingButton) existingButton.remove(); // prevent duplicates

  const button = document.createElement('button');
  button.id = 'jekyll-convert-btn';
  button.innerHTML = '📝 Convert to Markdown';
  button.style = `
    position: fixed;
    right: 20px;
    top: 20px;
    z-index: 9999;
    padding: 8px 16px;
    background: #1a73e8;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-family: system-ui;
  `;

  button.onclick = () => {
    const markdown = getMarkdownContent();
    if (!markdown) {
      alert('Could not convert document. Check console for details.');
      return;
    }

    showPreview(markdown);
  };

  document.body.appendChild(button);
}

function showPreview(markdown) {
  const popup = document.createElement('div');
  popup.style = `
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-height: 80vh;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    z-index: 10000;
    overflow: auto;
    font-family: system-ui;
  `;

  // prevent html injection
  const escapedMarkdown = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  popup.innerHTML = `
    <button onclick="this.parentElement.remove()" 
            style="float:right;padding:8px;border:none;background:none;cursor:pointer">✕</button>
    <h3>Markdown Preview</h3>
    <pre style="white-space:pre-wrap;background:#f5f5f5;padding:16px;border-radius:4px;margin-top:16px">${escapedMarkdown}</pre>
  `;

  document.body.appendChild(popup);
}

// initialize with error boundary
try {
  createButton();
} catch (err) {
  console.error('Failed to initialize parser:', err);
}
