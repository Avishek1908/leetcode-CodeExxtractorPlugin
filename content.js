chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "extractCode") {
    const textarea = document.querySelector('textarea.inputarea');
    const code = textarea ? textarea.value : "❌ No code found.";
    
    // Send code back to popup
    chrome.runtime.sendMessage({ action: "sendCodeToPopup", code });

    // ✅ Tell Chrome we handled the message (avoids the error)
    sendResponse({});
  }
});
