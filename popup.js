// popup.js
document.getElementById('jekyllForm').onsubmit = async (e) => {
  e.preventDefault();
  
  // get current tab (where google doc is)
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  
  // get doc content from content.js
  const docContent = await chrome.tabs.sendMessage(tab.id, {action: 'getDocContent'});
  
  // send to background for github publishing
  await chrome.runtime.sendMessage({
    action: 'publishToGithub',
    data: {
      date: document.getElementById('postDate').value,
      slug: document.getElementById('postSlug').value,
      ...docContent
    }
  });
};
