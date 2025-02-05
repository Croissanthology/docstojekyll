// parser.js
const parseDoc = () => {
  // get main doc content
  const editor = document.querySelector('.kix-appview-editor');
  if (!editor) {
    console.error('no editor found - are we on google docs?');
    return;
  }

  // grab metadata
  const title = document.querySelector('[data-heading="TITLE"]')?.innerText || document.title;
  const suggestedSlug = document.title.toLowerCase().replace(/\W+/g, '-');

  // parse content into markdown
  const content = convertToMarkdown(editor);

  // for testing: inject result into page
  const previewDiv = document.createElement('div');
  previewDiv.style = 'position: fixed; right: 0; top: 0; width: 400px; height: 100vh; background: white; padding: 20px; overflow: auto; z-index: 9999;';
  previewDiv.innerHTML = `
    <h3>Preview</h3>
    <p>Title: ${title}</p>
    <p>Slug: ${suggestedSlug}</p>
    <pre>${content}</pre>
  `;
  document.body.appendChild(previewDiv);
};

// inject a test button
const button = document.createElement('button');
button.innerText = 'Test Parser';
button.style = 'position: fixed; left: 10px; top: 10px; z-index: 9999;';
button.onclick = parseDoc;
document.body.appendChild(button);
