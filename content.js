// content.js
function processText(element) {
  let text = element.textContent;
  const style = window.getComputedStyle(element);
  
  // handle formatting
  if (style.fontWeight === 'bold' || style.fontWeight >= 600) {
    text = `**${text}**`;
  }
  if (style.fontStyle === 'italic') {
    text = `*${text}*`;
  }
  // add link if it exists
  const link = element.closest('a');
  if (link) {
    text = `[${text}](${link.href})`;
  }
  return text;
}

function processElement(element) {
  if (!element) return '';
  
  // check element style
  const tagName = element.tagName?.toLowerCase();
  const style = window.getComputedStyle(element);
  const headingLevel = parseInt(style.fontSize) >= 20 ? Math.ceil((30 - parseInt(style.fontSize))/3) : 0;
  
  let markdown = '';
  
  // handle headings
  if (headingLevel > 0 && headingLevel <= 6) {
    markdown += '#'.repeat(headingLevel) + ' ';
  }
  
  // handle lists
  if (element.classList.contains('kix-listitem')) {
    const depth = parseInt(style.marginLeft || '0') / 36;  // rough indent calculation
    markdown += '  '.repeat(depth) + '* ';
  }
  
  // process children or text
  if (element.childNodes.length > 0) {
    Array.from(element.childNodes).forEach(child => {
      if (child.nodeType === 3) { // text node
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
    // get title and metadata
    const title = document.querySelector('[data-heading="TITLE"]')?.innerText || 
                 document.title || 
                 'Untitled';
    
    const docName = document.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // get main content area
    const editor = document.querySelector('.kix-appview-editor');
    if (!editor) {
      throw new Error('Could not find Google Doc content');
    }

    // convert to markdown
    let content = '';
    Array.from(editor.children).forEach(child => {
      content += processElement(child);
    });

    // build jekyll frontmatter
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

// message listener stays the same
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getDocContent') {
    const content = getDocContent();
    sendResponse(content);
  }
});
