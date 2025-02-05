// content.js
function getDocContent() {
  try {
    // metadata from doc
    const title = document.querySelector('[data-heading="TITLE"]')?.innerText || 
                 document.title || 
                 'Untitled';
    
    const docName = document.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // get main content area
    const editor = document.querySelector('#kix-appview, .kix-appview-editor');
    if (!editor) {
      throw new Error('Could not find Google Doc content');
    }

    // for now just getting raw text (we'll make this smarter)
    const content = editor.innerText;
    if (!content) {
      throw new Error('Document appears to be empty');
    }

    return {
      title: title,
      suggestedSlug: docName,
      content: content,
      url: window.location.href
    };
  } catch (err) {
    console.error('Error parsing doc:', err);
    return null;
  }
}

// listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getDocContent') {
    const content = getDocContent();
    sendResponse(content);
  }
});

// add a subtle indicator that we're active
const indicator = document.createElement('div');
indicator.innerHTML = '📝';
indicator.style = `
  position: fixed;
  right: 20px;
  top: 20px;
  z-index: 9999;
  opacity: 0.5;
`;
document.body.appendChild(indicator);
