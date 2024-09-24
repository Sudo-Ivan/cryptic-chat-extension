function discordParse(codebook) {
  let decryptedTexts = [];

  const chatArea = document.querySelector('.chatContent_a7d72e');
  if (!chatArea) return decryptedTexts;

  const messageElements = chatArea.querySelectorAll('[id^="chat-messages-"]');
  for (let i = 0; i < messageElements.length; i++) {
      const decryptedText = decryptElement(messageElements[i], codebook);
      if (decryptedText) {
          decryptedTexts.push(decryptedText);
          if (decryptedTexts.length >= 10) break;
      }
  }

  return decryptedTexts;
}

function decryptElement(messageElement, codebook) {
  try {
      const contentElement = messageElement.querySelector('[id^="message-content-"]');
      if (!contentElement) return null;

      const originalText = contentElement.textContent.trim();
      let decryptedText = originalText;

      for (const key in codebook) {
          if (Object.prototype.hasOwnProperty.call(codebook, key)) {
              const value = codebook[key];
              decryptedText = decryptedText.replace(new RegExp(escapeRegExp(value), 'g'), key);
          }
      }

      if (decryptedText !== originalText) {
          const usernameElement = messageElement.querySelector('[class*="username_"]');
          const timestampElement = messageElement.querySelector('time');

          const username = usernameElement ? usernameElement.textContent.trim() : 'Unknown User';
          const timestamp = timestampElement ? timestampElement.getAttribute('aria-label') : '';

          return `${username}: ${decryptedText} - ${timestamp}`;
      }

      return null;
  } catch (error) {
      console.error("Error in decryptElement: ", error);
      return null;
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}