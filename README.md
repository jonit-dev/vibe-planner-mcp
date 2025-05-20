# Vibe Planner 🚀

Welcome to Vibe Planner! Get ready to supercharge your productivity and conquer your projects with our sleek, Kanban-style task management application. Vibe Planner isn't just a to-do list; it's your project's command center, complete with a robust backend API and an intuitive client-side interface.

## About The Project ✨

Vibe Planner is an MCP (Model Context Protocol) enabled powerhouse! Here's what makes it tick:

- A rock-solid backend API built with Node.js, Express, and TypeScript.
- Reliable data persistence with a SQLite database.
- A dynamic client-side application (check it out in the `client/` directory!).
- Seamless integration with MCP tools, unlocking AI-assisted development workflows to boost your coding speed and creativity.

## Getting Started 🏁

Ready to dive in? Getting Vibe Planner up and running on your local machine is a breeze. Just follow these simple steps:

### Prerequisites

Make sure you have these tools installed:

- Node.js (v18.x or later is perfect!)
- Yarn (v1.x)

### Installation

Let's get those dependencies installed!

1.  Clone the repository to your local machine:
    ```sh
    git clone <your-repository-url>
    ```
2.  Navigate into your new project directory:
    ```sh
    cd cursor-tasklist-mcp
    ```
3.  Install the core backend dependencies:
    ```sh
    yarn install
    ```
4.  Now, let's set up the client. Head into the `client` directory and install its dependencies:
    ```sh
    cd client
    yarn install
    cd ..
    ```

## Quick Start ⚡

Want to jump straight into the action? Here's the fast track:

1.  **Clone & Navigate:**
    ```sh
    git clone <your-repository-url>
    cd cursor-tasklist-mcp
    ```
2.  **Install Everything (Root & Client):**
    ```sh
    yarn install && (cd client && yarn install)
    ```
3.  **Launch the Dev Magic! (API & Client):**

    ```sh
    yarn ui:dev
    ```

4.  **Unlock AI Superpowers with MCP Client:**
    To let AI tools (like your trusty assistant, Cursor!) work with your local Vibe Planner, peek at the "MCP (Model Context Protocol) Configuration for Development" section below. It's your key to AI-assisted awesomeness!

```json
{
  // ... other configurations ...
  "vibe-planner": {
    "command": "node",
    "args": [
      "/home/youruserhere/projects/cursor-tasklist-mcp/dist/server.js" // Make sure to adjust this path!
    ],
    "enabled": true,
    "env": {
      "VIBE_PLANNER_PROJECT_ROOT": "/home/youruserhere/projects/cursor-tasklist-mcp", // And this one too!
      "NODE_ENV": "production" // Or "development" if your dev server has different needs
    }
  }
  // ... other configurations ...
}
```

## Available Scripts 🛠️

Power up your workflow with these handy scripts from the project root:

- `yarn build`: Compiles the TypeScript code, getting your backend API ready for action.
- `yarn start`: Fires up the production server for the API (run `yarn build` first!).
- `yarn dev`: Starts the backend API in development mode with Nodemon, so it reloads automatically with your changes – super convenient!
- `yarn test`: Runs all your backend unit tests using Vitest to ensure everything is A-OK.
- `yarn start:api`: Quickly starts the API using `ts-node` – great for fast checks without a full build.
- `yarn dev:api`: Specifically starts the backend API in development mode with Nodemon, keeping an eye on API and VibePlanner files.
- `yarn ui:dev`: The command to rule them all! Runs both the backend API (`dev:api`) and the client-side development server (`client/yarn dev`) together. This is your go-to for full-stack development and seeing that beautiful Kanban board in action.
- `yarn db:reset`: Need a fresh start? This resets your SQLite database.

### Client-Side Commands

Head over to the `client/` directory for these:

- `yarn dev`: Launches the client-side development server.
- `yarn build`: Bundles your client application for its grand production debut.

## Development Setup 💻

For the ultimate full-stack development vibe, where you can see both the API and the UI (your awesome Kanban board!) working in harmony:

1.  Double-check that all dependencies are installed in both the root and `client/` directories (see the Installation section if you skipped it!).
2.  Open your terminal in the project root directory.
3.  Unleash the power with:
    ```sh
    yarn ui:dev
    ```
    This magical command starts both the backend API and the client development server. Your API will usually be at `http://localhost:PORT_API` (your terminal will tell you!) and the client at `http://localhost:PORT_CLIENT`.

## What's Inside? Project Structure 🗺️

Curious about how Vibe Planner is organized? Here's a map:

```
cursor-tasklist-mcp/
├── client/         # ✨ Your Frontend Application lives here!
│   ├── src/        #   (Source code for the UI)
│   └── package.json  #   (Client-specific dependencies and scripts)
├── docs/           # 📚 General project documentation.
├── mcp_docs/       # 🤖 MCP-specific documentation (for AI integration).
├── src/            # ⚙️ The Backend API's heart and soul.
│   ├── constants/  #   (Important global values)
│   ├── http-api/   #   (Express API controllers, routes – where the web magic happens!)
│   ├── mcp-tools/  #   (Definitions for our amazing MCP tools)
│   ├── services/   #   (Business logic and core functionalities)
│   ├── tools/      #   (Utility functions and helpers)
│   └── vibeplanner/  #   (Core VibePlanner logic – the secret sauce!)
├── package.json      # Root project dependencies and scripts.
├── tsconfig.json     # TypeScript configuration for the backend.
└── vibeplanner.db    # Your SQLite database file – where all the tasks are stored!
```

## Contributing 🤝

Got ideas? Found a bug? We love contributions! Please stick to the existing code style, make sure those tests pass, and let's make Vibe Planner even better together!

---

This README gives you a great starting point! For even more nitty-gritty details on architecture and MCP integration, be sure to explore the `docs/` and `mcp_docs/` folders.
Happy Vibe Planning! 🎉
