// content.js
function processText(element) {
  let text = element.textContent;
  const style = window.getComputedStyle(element);
  
  if (style.fontWeight === 'bold' || style.fontWeight >= 600) {
    text = `**${text}**`;
  }
  if (style.fontStyle === 'italic') {
    text = `*${text}*`;
  }
  const link = element.closest('a');
  if (link) {
    text = `[${text}](${link.href})`;
  }
  return text;
}

function processElement(element) {
  if (!element) return '';
  
  const tagName = element.tagName?.toLowerCase();
  const style = window.getComputedStyle(element);
  const headingLevel = parseInt(style.fontSize) >= 20 ? Math.ceil((30 - parseInt(style.fontSize))/3) : 0;
  
  let markdown = '';
  
  if (headingLevel > 0 && headingLevel <= 6) {
    markdown += '#'.repeat(headingLevel) + ' ';
  }
  
  if (element.classList.contains('kix-listitem')) {
    const depth = parseInt(style.marginLeft || '0') / 36;
    markdown += '  '.repeat(depth) + '* ';
  }
  
  if (element.childNodes.length > 0) {
    Array.from(element.childNodes).forEach(child => {
      if (child.nodeType === 3) {
        markdown += processText(child.parentElement);
      } else {
        markdown += processElement(child);
      }
    });
  } else {
    markdown += processText(element);
  }
  
  return markdown + '\n';
}

function getDocContent() {
  try {
    const title = document.querySelector('[data-heading="TITLE"]')?.innerText || 
                 document.title || 
                 'Untitled';
    
    const docName = document.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const editor = document.querySelector('.kix-appview-editor');
    if (!editor) {
      throw new Error('Could not find Google Doc content');
    }

    let content = '';
    Array.from(editor.children).forEach(child => {
      content += processElement(child);
    });

    const frontmatter = `---
layout: post
title: "${title}"
date: ${new Date().toISOString().split('T')[0]}
permalink: /${docName}
---

`;

    return {
      title,
      suggestedSlug: docName,
      content: frontmatter + content,
      url: window.location.href
    };
  } catch (err) {
    console.error('Error parsing doc:', err);
    return null;
  }
}

// Add proper message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'getDocContent') {
      const content = getDocContent();
      console.log('sending content back:', content);
      sendResponse(content);
    }
  } catch (err) {
    console.error("Error in content script:", err);
    sendResponse({ error: err.message });
  }
  return true;  // Keep message channel open for async response
});
