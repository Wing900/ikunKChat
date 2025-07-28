# KChat

> An AI-powered chat application featuring a fluid, glass-morphism interface and persistent conversation history, built with React and Gemini.

<!-- Badges can be added here -->
![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)

## Table of Contents

- [About The Project](#about-the-project)
  - [Key Features](#key-features)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## About The Project

KChat is a modern, AI-driven chat application designed for seamless and intelligent conversations. It boasts a visually stunning "liquid glass" interface that is both intuitive and responsive. The application leverages the power of Google's Gemini models to provide insightful and context-aware responses.

Key features include persistent chat history stored locally, dynamic model selection, file attachments, and advanced chat organization with folders and search. The latest version introduces a comprehensive settings panel, multi-language support, data import/export capabilities, and AI-powered suggested replies to streamline your workflow.

### Key Features

*   **Intelligent AI Chat:** Powered by Google's Gemini family of models.
*   **Rich Content Rendering:** Displays Markdown, LaTeX, Mermaid diagrams, and syntax-highlighted code blocks.
*   **Persistent History:** Conversations are saved to your browser's local storage.
*   **Dynamic Model Selection:** Switch between available Gemini models for different tasks.
*   **File Attachments:** Include images and documents in your prompts.
*   **Advanced Chat Organization:**
    *   Organize chats into folders with drag-and-drop.
    *   Edit chat and folder titles/icons.
    *   Searchable chat history.
*   **Suggested Replies:** AI-generated one-tap replies to continue the conversation.
*   **Comprehensive Settings Panel:**
    *   Multi-language support (English/Chinese).
    *   Theme selection (Light/Dark).
    *   Full data import and export (JSON).
    *   Option to clear all local data.
*   **Glassmorphism UI:** A beautiful, fluid interface with light and dark modes.

### Built With

*   React
*   TypeScript
*   Google Gemini API (`@google/genai`)
*   Marked, DOMPurify, KaTeX, Mermaid, highlight.js
*   Tailwind CSS (via CDN)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You will need a Google Gemini API key to use this application.
*   You can get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation

Since this project is built with modern web technologies and uses CDN-based dependencies, there's no complex build process required.

1.  Clone the repo
    ```sh
    git clone https://github.com/KuekHaoYang/KChat
    cd kchat
    ```
2. Install NPM packages
    ```sh
    npm install
    ```
 3.  Start the development server:
    ```sh
    npm run dev
    ```

Then navigate to the local address provided in your terminal (e.g., `http://localhost:5173`) in your browser.

## Usage

1.  Open the application.
2.  If you haven't configured your API key via environment variables, open the **Settings** panel (cog icon in the sidebar).
3.  Enter your Gemini API key in the designated field.
4.  Start a new chat from the main screen or the sidebar.
5.  Type your message, attach files, and interact with the AI.

## Configuration

The Gemini API key can be configured in two ways:

1.  **Via Settings UI (Recommended for local use):**
    *   Click the settings icon in the sidebar.
    *   Under the "Model" section, paste your API key into the input field. The key will be saved securely in your browser's local storage.

2.  **Via Environment Variable (For deployments):**
    *   The application can be configured to use an API key set in the environment variables of the host system. If `process.env.API_KEY` is available, the input field in the settings will be disabled.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire,and create. Any contributions you make are **greatly appreciated**.

Please refer to the project's issue tracker for ways to contribute. If you have suggestions, please open an issue to discuss it first. We follow the standard fork-and-pull-request workflow.

## License

Distributed under the MIT License. See `LICENSE` for more information.