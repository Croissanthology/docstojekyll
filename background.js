// background.js
const CONFIG = {
  REPO: 'croissanthology/croissanthology.github.io',
  BRANCH: 'main'
};

async function githubApi(path, method = 'GET', data = null) {
  const token = await chrome.storage.sync.get('github_token');
  if (!token.github_token) {
    throw new Error('GitHub token not configured');
  }

  const url = `https://api.github.com/repos/${CONFIG.REPO}/${path}`;
  const options = {
    method,
    headers: {
      'Authorization': `token ${token.github_token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GitHub API Error: ${error.message}`);
  }
  return response.json();
}

async function commitPost(fileName, content) {
  const endpoint = `_posts/${encodeURIComponent(fileName)}`;
  const encoded = btoa(unescape(encodeURIComponent(content)));
  
  try {
    // check if file exists
    const existing = await githubApi(endpoint);
    return await githubApi(endpoint, 'PUT', {
      message: `Update post: ${fileName}`,
      content: encoded,
      sha: existing.sha,
      branch: CONFIG.BRANCH
    });
  } catch (e) {
    if (e.message.includes('Not Found')) {
      // new file
      return await githubApi(endpoint, 'PUT', {
        message: `Create new post: ${fileName}`,
        content: encoded,
        branch: CONFIG.BRANCH
      });
    }
    throw e;
  }
}

async function updateIndex(newTitle, newUrl) {
  const indexPath = 'index.html';
  const currentIndex = await githubApi(indexPath);
  const content = decodeURIComponent(escape(atob(currentIndex.content)));
  
  // extract existing list
  const listMatch = content.match(/(<ul[^>]*>)([\s\S]*?)(<\/ul>)/);
  if (!listMatch) throw new Error('Could not find post list in index.html');
  
  let [fullMatch, startTag, listItems, endTag] = listMatch;
  const existingItems = listItems.match(/<li>[\s\S]*?<\/li>/g) || [];

  // prevent duplicates
  if (existingItems.some(item => item.includes(newUrl))) {
    console.log(`Already listed: ${newUrl}`);
    return;
  }

  // update list
  const newItem = `<li><a href="${newUrl}">${newTitle}</a></li>`;
  const updatedItems = [newItem, ...existingItems].slice(0, 5);
  const updatedList = `${startTag}\n${updatedItems.join('\n')}\n${endTag}`;
  const updatedContent = content.replace(fullMatch, updatedList);

  // commit changes
  await githubApi(indexPath, 'PUT', {
    message: `Update index with: ${newTitle}`,
    content: btoa(unescape(encodeURIComponent(updatedContent))),
    sha: currentIndex.sha,
    branch: CONFIG.BRANCH
  });
}

// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'publishToGithub') {
    // wrap in async handler
    (async () => {
      try {
        const {date, title, content, suggestedSlug} = request.data;
        const fileName = `${date}-${suggestedSlug}.md`;

        await Promise.all([
          commitPost(fileName, content),
          updateIndex(title, `/${suggestedSlug}`)
        ]);
        sendResponse({success: true});
      } catch (err) {
        sendResponse({success: false, error: err.message});
      }
    })();
    return true; // CRITICAL: keeps message channel open
  }
  return true; // handle other messages too
});
