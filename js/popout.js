// Popout functionality for Cryptic Chat

const CrypticChatPopout = {
    popoutWindow: null,

    openPopout: function() {
        const width = 400;
        const height = 600;
        const left = (screen.width / 2) - (width / 2);
        const top = (screen.height / 2) - (height / 2);

        this.popoutWindow = window.open(
            chrome.runtime.getURL('html/popout.html'),
            'CrypticChatPopout',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        this.popoutWindow.addEventListener('beforeunload', () => {
            CrypticChat.createCrypticChatWindow(false);
        });
    },

    closePopout: function() {
        if (this.popoutWindow) {
            this.popoutWindow.close();
            this.popoutWindow = null;
        }
    }
};