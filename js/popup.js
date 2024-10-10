let isProcessing = false;

function processText(action, inputElement, outputElement) {
  if (isProcessing) return;
  isProcessing = true;

  const inputText = inputElement.value;

  if (!inputText.trim()) {
    outputElement.value = '';
    isProcessing = false;
    return;
  }

  chrome.runtime.sendMessage({ action: action, message: inputText }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Runtime error:", chrome.runtime.lastError.message);
      outputElement.value = "Error: Could not process " + action + ".";
    } else if (response?.[action + 'edMessage']) {
      outputElement.value = response[action + 'edMessage'];
    } else {
      console.error("Unexpected response:", response);
      outputElement.value = "";
    }
    isProcessing = false;
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

document.addEventListener('DOMContentLoaded', function() {
  const inputText = document.getElementById("inputText");
  const outputText = document.getElementById("outputText");

  const debouncedEncrypt = debounce(() => processText("encrypt", inputText, outputText), 300);
  const debouncedDecrypt = debounce(() => processText("decrypt", outputText, inputText), 300);

  inputText.addEventListener('input', debouncedEncrypt);
  outputText.addEventListener('input', debouncedDecrypt);

  document.getElementById("openOptions").addEventListener("click", () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showResults") {
      if (request.results.encryptedMessage) {
        outputText.value = request.results.encryptedMessage;
        inputText.value = request.message || "";
      } else if (request.results.decryptedMessage) {
        inputText.value = request.results.decryptedMessage;
        outputText.value = request.message || "";
      }
    }
  });

  document.getElementById("popoutCodebook").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "popoutCodebook" });
  });
});