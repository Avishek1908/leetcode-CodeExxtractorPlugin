// Utility function to show status messages
function showStatus(message, type = 'success') {
  const statusElement = document.getElementById('statusMessage');
  statusElement.textContent = message;
  statusElement.className = `status show ${type}`;
  
  setTimeout(() => {
    statusElement.className = 'status';
  }, 3000);
}

// Copy Code button functionality
document.getElementById("extractBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Optional safety check: ensure it's a leetcode tab
  if (!tab || !tab.url.includes("leetcode.com")) {
    showStatus("Not a LeetCode page!", 'error');
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: "extractCode" }, () => {});
});

// Copy Status button functionality
document.getElementById("copyStatusBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Optional safety check: ensure it's a leetcode tab
  if (!tab || !tab.url.includes("leetcode.com")) {
    showStatus("Not a LeetCode page!", 'error');
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: "extractStatus" }, () => {});
});

// Listen for message from content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "sendCodeToPopup") {
    const code = msg.code;
    if (code === "No code found.") {
      showStatus("No code found on this page!", 'error');
    } else {
      navigator.clipboard.writeText(code).then(() => {
        showStatus("Code copied to clipboard!", 'success');
      }).catch(err => {
        showStatus("Clipboard write failed!", 'error');
      });
    }
  }
  
  if (msg.action === "sendStatusToPopup") {
    const status = msg.status;
    if (status === "No status found.") {
      showStatus("No status information found!", 'error');
    } else {
      navigator.clipboard.writeText(status).then(() => {
        showStatus("Status copied to clipboard!", 'success');
      }).catch(err => {
        showStatus("Clipboard write failed!", 'error');
      });
    }
  }
});