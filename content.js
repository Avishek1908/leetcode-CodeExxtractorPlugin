chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "extractCode") {
    const textarea = document.querySelector('textarea.inputarea');
    const code = textarea ? textarea.value : "No code found.";
    
    // Send code back to popup
    chrome.runtime.sendMessage({ action: "sendCodeToPopup", code });

    // Tell Chrome we handled the message (avoids the error)
    sendResponse({});
  }
  
  if (msg.action === "extractStatus") {
    // Try to extract problem status/information from the page
    const statusInfo = extractProblemStatus();
    
    // Send status back to popup
    chrome.runtime.sendMessage({ action: "sendStatusToPopup", status: statusInfo });

    // Tell Chrome we handled the message
    sendResponse({});
  }
});

function extractProblemStatus() {
  try {
    // Extract problem title for context
    const titleElement = document.querySelector('[data-cy="question-title"]') || 
                        document.querySelector('h1') ||
                        document.querySelector('.css-v3d350') ||
                        document.querySelector('[class*="title"]');
    const title = titleElement ? titleElement.textContent.trim() : 'Unknown Problem';

    // Primary submission status detection
    const submissionStatus = detectSubmissionStatus();
    
    // Compile status information with focus on submission result
    let statusInfo = `Problem: ${title}\n`;
    statusInfo += `Submission Status: ${submissionStatus.status}\n`;
    statusInfo += `Details: ${submissionStatus.details}\n`;
    statusInfo += `URL: ${window.location.href}\n`;
    statusInfo += `Checked: ${new Date().toLocaleString()}\n`;

    return statusInfo;
  } catch (error) {
    console.error('Error extracting status:', error);
    return "Error extracting status.";
  }
}

function detectSubmissionStatus() {
  // Multiple selectors to check for submission status across different LeetCode layouts
  const statusSelectors = [
    // Modern LeetCode submission result area
    '[data-e2e-locator="submission-result"]',
    '.submission-result',
    '[class*="submission-result"]',
    
    // Result panels and status indicators
    '.result-state',
    '[class*="result-state"]',
    '.status-display',
    '[class*="status-display"]',
    
    // Console/output area where results appear
    '.console-container',
    '[data-e2e-locator="console-result"]',
    '.result-panel',
    
    // Success/error message containers
    '.success-message',
    '.error-message',
    '[class*="success"]',
    '[class*="error"]',
    '[class*="accepted"]',
    '[class*="wrong"]',
    
    // General result containers
    '.result',
    '[class*="result"]',
    '.output',
    '[class*="output"]'
  ];

  let foundStatus = null;
  let statusDetails = '';

  // Check each selector for status indicators
  for (const selector of statusSelectors) {
    const elements = document.querySelectorAll(selector);
    
    for (const element of elements) {
      const text = element.textContent.toLowerCase();
      
      // Check for "Accepted" status
      if (text.includes('accepted') && !text.includes('not accepted')) {
        foundStatus = 'ACCEPTED';
        statusDetails = extractStatusDetails(element, 'accepted');
        return { status: foundStatus, details: statusDetails };
      }
      
      // Check for various failure indicators
      if (text.includes('wrong answer') || 
          text.includes('runtime error') || 
          text.includes('time limit exceeded') ||
          text.includes('memory limit exceeded') ||
          text.includes('compilation error') ||
          text.includes('failed') ||
          text.includes('incorrect') ||
          text.includes('error')) {
        foundStatus = 'FAILED';
        statusDetails = extractStatusDetails(element, 'failed');
        return { status: foundStatus, details: statusDetails };
      }
    }
  }

  // Additional check for specific LeetCode status patterns
  const allText = document.body.textContent.toLowerCase();
  
  if (allText.includes('accepted')) {
    foundStatus = 'ACCEPTED';
    statusDetails = 'Status detected in page content';
  } else if (allText.includes('wrong answer') || 
             allText.includes('runtime error') || 
             allText.includes('time limit exceeded')) {
    foundStatus = 'FAILED';
    statusDetails = 'Error status detected in page content';
  } else {
    foundStatus = 'NOT SUBMITTED YET';
    statusDetails = 'No submission result found - problem may not have been submitted or is still running';
  }

  return { status: foundStatus, details: statusDetails };
}

function extractStatusDetails(element, type) {
  const text = element.textContent.trim();
  
  if (type === 'accepted') {
    // Look for runtime and memory stats
    const runtimeMatch = text.match(/runtime:?\s*(\d+)\s*ms/i) || text.match(/(\d+)\s*ms/i);
    const memoryMatch = text.match(/memory:?\s*([\d.]+)\s*mb/i) || text.match(/([\d.]+)\s*mb/i);
    
    let details = 'Solution accepted successfully!';
    if (runtimeMatch) details += ` Runtime: ${runtimeMatch[1]}ms`;
    if (memoryMatch) details += ` Memory: ${memoryMatch[1]}MB`;
    
    return details;
  } else if (type === 'failed') {
    // Extract error details
    if (text.includes('wrong answer')) {
      const testCaseMatch = text.match(/test case (\d+)/i);
      return testCaseMatch ? `Wrong Answer on test case ${testCaseMatch[1]}` : 'Wrong Answer';
    } else if (text.includes('time limit exceeded')) {
      return 'Time Limit Exceeded';
    } else if (text.includes('runtime error')) {
      return 'Runtime Error';
    } else if (text.includes('memory limit exceeded')) {
      return 'Memory Limit Exceeded';
    } else if (text.includes('compilation error')) {
      return 'Compilation Error';
    } else {
      return 'Submission failed';
    }
  }
  
  return text.substring(0, 100) + (text.length > 100 ? '...' : '');
}