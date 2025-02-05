// popup.js
// prefill data from doc
async function prefillForm() {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const docContent = await chrome.tabs.sendMessage(tab.id, {action: 'getDocContent'});
  
  if (docContent) {
    document.getElementById('postTitle').value = docContent.title;
    document.getElementById('postSlug').value = docContent.suggestedSlug;
    // default to today if we can't get doc creation date
    document.getElementById('postDate').value = new Date().toISOString().split('T')[0];
  }

  // load saved token if exists
  const token = await chrome.storage.sync.get('github_token');
  if (token.github_token) {
    document.getElementById('githubToken').value = token.github_token;
  }
}

// handle token save
document.getElementById('saveToken').onclick = async () => {
  const token = document.getElementById('githubToken').value;
  await chrome.storage.sync.set({ github_token: token });
  
  // cute feedback
  const btn = document.getElementById('saveToken');
  btn.textContent = '✓ Saved!';
  btn.style.background = '#a8e6cf';
  setTimeout(() => {
    btn.textContent = 'Save Token';
    btn.style.background = '#ff8da1';
  }, 2000);
};

// handle publish
document.getElementById('jekyllForm').onsubmit = async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.textContent = '🚀 Publishing...';
  btn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const docContent = await chrome.tabs.sendMessage(tab.id, {action: 'getDocContent'});
    
    if (!docContent) throw new Error('Could not get document content');

    const result = await chrome.runtime.sendMessage({
      action: 'publishToGithub',
      data: {
        date: document.getElementById('postDate').value,
        title: document.getElementById('postTitle').value,
        slug: document.getElementById('postSlug').value,
        content: docContent.content
      }
    });

    if (result.success) {
      btn.textContent = '✨ Published!';
      btn.style.background = '#a8e6cf';
    } else {
      throw new Error(result.error);
    }
  } catch (err) {
    btn.textContent = '❌ Error';
    btn.style.background = '#ffb7b2';
    alert(err.message);
  }
};

// prefill on load
document.addEventListener('DOMContentLoaded', prefillForm);
