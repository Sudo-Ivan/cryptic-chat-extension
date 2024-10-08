# Security

The extension is designed to be secure and private. All data is stored locally on your device and is not shared with any third parties.

## Encryption method for exporting and importing codebooks 

The extension uses the [AES-256 encryption algorithm](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard) to encrypt and decrypt codebooks when exporting and importing, but this is a optional feature.

## Codebook

The codebook is a list of words that are used to encrypt and decrypt messages in the sense of replacing words with other words. There is no actual encryption happening.

Chrome Local Storage is used to store codebook and settings and is currently not encrypted. This is a WIP.

## Cryptic Chat Window

The Cryptic Chat Window is a popup that is displayed on supported websiteswhen the extension is activated. It is used to display decrypted messages and send cryptic ones.

Data that is decrypted in the chat window is stored in HTML on client side only.

# Chrome Extension Best Practices Used

## Manifest V3

Manifest V3 is the latest version of the Chrome Extension Manifest file.

## Declarative Net Request API

API to block requests to tracking servers.

## activeTab

The `activeTab` permission is used to allow the extension to access the content of the currently active tab.

## Content Security Policy

The extension uses a custom Content Security Policy to prevent cross-site scripting (XSS) attacks.

## Local Fonts

The extension uses local fonts.