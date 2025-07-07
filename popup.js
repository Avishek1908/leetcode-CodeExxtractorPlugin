document.getElementById("extractBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Optional safety check: ensure it's a leetcode tab
  if (!tab || !tab.url.includes("leetcode.com")) {
    alert("❌ Not a LeetCode page!");
    return;
  }

 chrome.tabs.sendMessage(tab.id, { action: "extractCode" }, () => {});

});

// Listen for message from content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "sendCodeToPopup") {
    const code = msg.code;
    navigator.clipboard.writeText(code).then(() => {
      alert("✅ Code copied to clipboard!");
    }).catch(err => {
      alert("❌ Clipboard write failed: " + err.message);
    });
  }
});
