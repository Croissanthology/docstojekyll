// Debug logging wrapper
const debug = (msg, ...args) => {
  console.log(`%c[Popup Debug] ${msg}`, 'background: #ffd1dc; color: #4a4a4a', ...args);
};

// Animated text input filling
async function typeInto(id, value, speed = 20) {
  const input = document.getElementById(id);
  input.value = '';
  for (let i = 0; i < value.length; i++) {
    input.value += value[i];
    await new Promise(r => setTimeout(r, speed));
  }
  input.style.color = '#4a4a4a';
}

async function prefillForm() {
  debug('Starting prefill');
  
  // Show loading state
  const fields = ['postTitle', 'postSlug', 'postDate'];
  fields.forEach(id => {
    const input = document.getElementById(id);
    input.style.color = '#aaa';
    input.value = 'loading...';
  });

  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    debug('Current tab:', tab?.id);
    if (!tab?.id) throw new Error('No active tab found');
    
    const docContent = await chrome.tabs.sendMessage(tab.id, {action: 'getDocContent'});
    debug('Received doc content:', docContent);

    // Get date from subtitle or default to today
    const subtitle = document.querySelector('[data-heading="SUBTITLE"]')?.innerText;
    const dateMatch = subtitle?.match(/\d{4}-\d{2}-\d{2}/);
    const date = dateMatch?.[0] || new Date().toISOString().split('T')[0];

    // Fill fields with animation
    await typeInto('postTitle', docContent.title);
    await typeInto('postSlug', docContent.suggestedSlug);
    await typeInto('postDate', date);
  } catch (err) {
    debug('Error in prefill:', err);
    console.error("Error getting document content:", err);
    fields.forEach(id => {
      const input = document.getElementById(id);
      input.style.color = '#4a4a4a';
      input.value = '';
    });
  }
}
// Confetti celebration
function celebrateSuccess() {
  try {
    const canvas = document.createElement('canvas');
    canvas.style = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10000;
    `;
    document.body.appendChild(canvas);
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const ctx = canvas.getContext('2d');

    const particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: 0,
        size: Math.random() * 5 + 5,
        color: ['#ff8da1', '#ffd1dc', '#a8e6cf', '#ffb7b2'][Math.floor(Math.random() * 4)],
        speed: Math.random() * 5 + 2,
        angle: Math.random() * Math.PI - Math.PI/2
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      
      particles.forEach(p => {
        if (p.y < canvas.height) {
          alive = true;
          p.y += p.speed;
          p.x += Math.cos(p.angle);
          p.angle += 0.05;
          
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      });
      
      if (alive) requestAnimationFrame(animate);
      else canvas.remove();
    }
    animate();
  } catch (e) {
    console.error("Confetti error:", e);
  }
}

// Handle saving GitHub token
document.getElementById('saveToken').onclick = async () => {
  const token = document.getElementById('githubToken').value;
  await chrome.storage.sync.set({ github_token: token });
  
  const btn = document.getElementById('saveToken');
  btn.textContent = '✓ Saved!';
  btn.style.background = '#a8e6cf';
  setTimeout(() => {
    btn.textContent = 'Save Token';
    btn.style.background = '#ff8da1';
  }, 2000);
};

// Handle form submission
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

    console.log("Publish result:", result);

    if (result.success) {
      btn.textContent = '✨ Published!';
      btn.style.background = '#a8e6cf';
      celebrateSuccess();
    } else {
      throw new Error(result.error || 'Failed to publish');
    }
  } catch (err) {
    debug('Publish error:', err);
    btn.textContent = '❌ Error';
    btn.style.background = '#ffb7b2';
    alert(err.message);
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = '✨ Publish Post';
      btn.style.background = '#ff8da1';
    }, 3000);
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  debug('DOM fully loaded');
  prefillForm().catch(err => {
    debug('Error during prefill:', err);
  });
});
