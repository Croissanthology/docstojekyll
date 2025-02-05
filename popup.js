// in popup.js, upgrade the prefillForm function:
async function prefillForm() {
  // show loading state
  const fields = ['postTitle', 'postSlug', 'postDate'];
  fields.forEach(id => {
    const input = document.getElementById(id);
    input.style.color = '#aaa';
    input.value = 'loading...';
  });

  // get doc data
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const docContent = await chrome.tabs.sendMessage(tab.id, {action: 'getDocContent'});
  
  if (docContent) {
    // animate filling each field
    const typeInto = async (id, value) => {
      const input = document.getElementById(id);
      input.value = '';
      for (let i = 0; i < value.length; i++) {
        input.value += value[i];
        await new Promise(r => setTimeout(r, 20)); // adjust speed here
      }
      input.style.color = '#4a4a4a';
    };

    // get doc creation date from subtitle or default to today
    const subtitle = document.querySelector('[data-heading="SUBTITLE"]')?.innerText;
    const dateMatch = subtitle?.match(/\d{4}-\d{2}-\d{2}/);
    const date = dateMatch?.[0] || new Date().toISOString().split('T')[0];

    // fill fields with animation
    await typeInto('postTitle', docContent.title);
    await typeInto('postSlug', docContent.suggestedSlug);
    await typeInto('postDate', date);
  }

  // load saved token (no animation needed)
  const token = await chrome.storage.sync.get('github_token');
  if (token.github_token) {
    document.getElementById('githubToken').value = token.github_token;
  }
}
