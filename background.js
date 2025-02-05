// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'publishToGithub') {
    // will handle github api calls here
    // receives data from popup.js
    // returns success/failure
  }
});
