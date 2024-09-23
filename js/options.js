document.addEventListener("DOMContentLoaded", () => {
  const wordlistTextArea = document.getElementById("wordlist");
  const saveBtn = document.getElementById("saveBtn");
  const uploadBtn = document.getElementById("uploadBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const fileInput = document.getElementById("fileInput");
  const dropZone = document.getElementById("dropZone");
  const updateFromUrlBtn = document.getElementById("updateFromUrlBtn");
  const autoUpdateCheckbox = document.getElementById("autoUpdate");
  const errorMsg = document.createElement("p");
  errorMsg.id = "errorMsg";
  errorMsg.style.color = "red";
  errorMsg.style.fontSize = "12px";
  document.querySelector(".options-container").appendChild(errorMsg);

  chrome.storage.local.get(["wordlist", "wordlistUrl", "autoUpdate"], (data) => {
    displayWordlist(data.wordlist || {});
    document.getElementById("urlInput").value = data.wordlistUrl || "";
    autoUpdateCheckbox.checked = data.autoUpdate || false;
  });

  saveBtn.addEventListener("click", saveWordlist);
  uploadBtn.addEventListener("click", () => fileInput.click());
  downloadBtn.addEventListener("click", downloadWordlist);
  fileInput.addEventListener("change", (event) => processFile(event.target.files[0]));
  updateFromUrlBtn.addEventListener("click", updateFromUrl);
  autoUpdateCheckbox.addEventListener("change", () => {
    chrome.storage.local.set({ autoUpdate: autoUpdateCheckbox.checked });
  });

  dropZone.addEventListener("dragover", handleDragOver);
  dropZone.addEventListener("dragleave", handleDragLeave);
  dropZone.addEventListener("drop", handleDrop);
});

function displayWordlist(wordlist) {
  const wordlistTextArea = document.getElementById("wordlist");
  let formattedWordlist = "";
  for (const [key, value] of Object.entries(wordlist)) {
    formattedWordlist += `${key} : ${value}\n`;
  }
  wordlistTextArea.value = formattedWordlist.trim();
}

function saveWordlist() {
  const wordlistTextArea = document.getElementById("wordlist");
  const lines = wordlistTextArea.value.split('\n');
  const updatedWordlist = {};
  let errorLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (line) {
      const [key, value] = line.split(':').map(item => item.trim());
      if (key && value) {
        updatedWordlist[key] = value;
      } else {
        errorLines.push(i + 1);
      }
    }
  }

  if (errorLines.length > 0) {
    showError(`Invalid format on line(s): ${errorLines.join(", ")}`);
    return;
  }

  chrome.storage.local.set({ wordlist: updatedWordlist }, () => {
    if (chrome.runtime.lastError) {
      showError("Error updating wordlist: " + chrome.runtime.lastError.message);
    } else {
      showError("Wordlist updated successfully!", false);
    }
  });
}

function processFile(file) {
  if (!file) return;
  
  if (file.type !== "text/plain") {
    showError("Please upload a .txt file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById("wordlist").value = e.target.result;
    saveWordlist();
  };
  reader.readAsText(file);
}

function downloadWordlist() {
  const wordlistTextArea = document.getElementById("wordlist");
  const content = wordlistTextArea.value;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'wordlist.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = "copy";
  event.target.classList.add("dragover");
}

function handleDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  event.target.classList.remove("dragover");
}

function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  event.target.classList.remove("dragover");

  const file = event.dataTransfer.files[0];
  processFile(file);
}

function showError(message, isError = true) {
  const errorMsg = document.getElementById("errorMsg");
  errorMsg.textContent = message;
  errorMsg.style.color = isError ? "red" : "green";
  if (isError) {
    console.error(message);
  } else {
    console.log(message);
  }
  setTimeout(() => {
    errorMsg.textContent = "";
  }, 5000);
}

function updateFromUrl() {
  const urlInput = document.getElementById("urlInput");
  let url = urlInput.value.trim();

  console.log("Original URL:", url);

  if (!isValidUrl(url)) {
    showError("Please enter a valid HTTPS URL ending with .txt");
    return;
  }

  if (url.startsWith('https://github.com/') && url.includes('/blob/')) {
    url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
  }

  console.log("Fetching from URL:", url);

  fetch(url)
    .then(response => {
      console.log("Response status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(text => {
      console.log("Fetched text:", text.substring(0, 100) + "...");
      document.getElementById("wordlist").value = text;
      saveWordlist();
      chrome.storage.local.set({ wordlistUrl: url });
      showError("Wordlist updated successfully from URL!", false);
    })
    .catch(error => {
      console.error("Fetch error:", error);
      showError("Error fetching wordlist: " + error.message);
    });
}

function isValidUrl(url) {
  return (url.startsWith('https://') && url.endsWith('.txt')) || 
         (url.startsWith('https://github.com/') && url.includes('/blob/') && url.endsWith('.txt'));
}