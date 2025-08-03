# KChat

> An AI-powered chat application featuring a fluid, glass-morphism interface and persistent conversation history, built with React and Gemini.

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

All chat history, settings, and custom personas are stored securely in your browser's local storage, ensuring your data remains private and persistent across sessions.

### Key Features

*   **Intelligent AI Chat:** Powered by Google's Gemini family of models.
*   **Rich Content Rendering:** Displays Markdown, LaTeX, Mermaid diagrams, and syntax-highlighted code blocks.
*   **Custom Personas:** Create, edit, and chat with different AI personalities.
*   **Built-in Translator:** A dedicated translation interface with language detection and multiple modes.
*   **Persistent History:** Conversations, settings, and personas are saved locally.
*   **Advanced Chat Organization:**
    *   Organize chats into folders with drag-and-drop.
    *   Searchable chat history.
    *   Archive unwanted chats.
*   **Comprehensive Settings Panel:**
    *   Multi-language support (English/Chinese).
    *   Theme selection (Light/Dark).
    *   Full data import and export (JSON).
*   **Glassmorphism UI:** A beautiful, fluid interface with light and dark modes.

### Built With

*   [React](https://reactjs.org/)
*   [TypeScript](https://www.typescriptlang.org/)
*   [@google/genai](https://www.npmjs.com/package/@google/genai)
*   [Marked](https://marked.js.org/) & [highlight.js](https://highlightjs.org/)
*   [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You will need a Google Gemini API key to use this application.
*   Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/KuekHaoYang/KChat.git
    cd KChat
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```
3.  Start the development server
    ```sh
    npm run dev
    ```
Navigate to the local address provided in your terminal (e.g., `http://localhost:5173`).

## Usage

1.  Open the application in your browser.
2.  Open the **Settings** panel (cog icon in the sidebar).
3.  Enter your Gemini API key in the designated field.
4.  Start a new chat from the main screen or by selecting a Persona.
5.  Type your message, attach files, and interact with the AI.

## Configuration

The application can be configured via the settings panel or environment variables.

#### Settings Panel
- **API Key**: Enter one or more Gemini API keys, separated by newlines or commas. The app will rotate through them.
- **API Base URL**: Optionally, provide a proxy or custom endpoint. If left blank, it will default to the official Google API URL.

#### Environment Variables
For deployments or advanced local setups, you can create a `.env` file in the project root.

```dotenv
# Your Gemini API Key (will lock the UI input)
API_KEY="YOUR_API_KEY"

# Optional custom API endpoint (will lock the UI input)
API_BASE_URL="https://your-proxy-url.com/api"
```

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

Please refer to the project's issue tracker for ways to contribute. If you have suggestions, please open an issue to discuss it first. We follow the standard fork-and-pull-request workflow.

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Kuek Hao Yang - [@KuekHaoYang](https://github.com/KuekHaoYang)

Project Link: [https://github.com/KuekHaoYang/KChat](https://github.com/KuekHaoYang/KChat)

For issues, questions, or feature requests, please use the [GitHub Issues](https://github.com/KuekHaoYang/KChat/issues) page.
