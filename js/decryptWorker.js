self.onmessage = function(e) {
    const { text, codebook } = e.data;
    let decryptedText = text;
    for (const key in codebook) {
        if (Object.hasOwnProperty.call(codebook, key)) {
            const value = codebook[key];
            decryptedText = decryptedText.replace(new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), key);
        }
    }
    self.postMessage(decryptedText);
};