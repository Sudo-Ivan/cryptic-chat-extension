document.addEventListener("DOMContentLoaded", () => {
  const wordlistTextArea = document.getElementById("wordlist");
  const saveBtn = document.getElementById("saveBtn");
  const uploadBtn = document.getElementById("uploadBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const fileInput = document.getElementById("fileInput");

  chrome.storage.local.get("wordlist", (data) => {
      displayWordlist(data.wordlist || {});
  });

  saveBtn.addEventListener("click", saveWordlist);
  uploadBtn.addEventListener("click", () => fileInput.click());
  downloadBtn.addEventListener("click", downloadWordlist);
  fileInput.addEventListener("change", uploadWordlist);
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

  for (let line of lines) {
      line = line.trim();
      if (line) {
          const [key, value] = line.split(':').map(item => item.trim());
          if (key && value) {
              updatedWordlist[key] = value;
          }
      }
  }

  chrome.storage.local.set({ wordlist: updatedWordlist }, () => {
      if (chrome.runtime.lastError) {
          alert("Error updating wordlist: " + chrome.runtime.lastError.message);
      } else {
          alert("Wordlist updated successfully!");
      }
  });
}

function uploadWordlist(event) {
  const file = event.target.files[0];
  if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
          document.getElementById("wordlist").value = e.target.result;
          saveWordlist();
      };
      reader.readAsText(file);
  }
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