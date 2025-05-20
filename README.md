# Vibe Planner

Vibe Planner is a task management application designed to help you organize and track your projects using a Kanban-style board. It includes a backend API and a client-side interface.

## About The Project

This project is an MCP (Model Context Protocol) enabled application. It features:

- A backend API built with Node.js, Express, and TypeScript.
- A SQLite database for persistence.
- A client-side application (presumably React/Vue/Angular, located in the `client/` directory).
- Integration with MCP tools for AI-assisted development workflows.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18.x or later recommended)
- Yarn (v1.x)

### Installation

1.  Clone the repository:
    ```sh
    git clone <your-repository-url>
    ```
2.  Navigate to the project root directory:
    ```sh
    cd cursor-tasklist-mcp
    ```
3.  Install root dependencies:
    ```sh
    yarn install
    ```
4.  Navigate to the client directory and install client dependencies:
    ```sh
    cd client
    yarn install
    cd ..
    ```

## Quick Start

For those who want to get up and running as quickly as possible:

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd cursor-tasklist-mcp
    ```
2.  **Install all dependencies (root and client):**
    ```sh
    yarn install && (cd client && yarn install)
    ```
3.  **Run the development servers (API and Client):**
    ```sh
    yarn ui:dev
    ```
    Your API will typically be running on a port shown in the terminal (e.g., http://localhost:8080), and the client application on another (e.g., http://localhost:3000).
4.  **Configure MCP Client for AI-Assisted Development:**
    To enable AI tools (like Cursor) to interact with your local Vibe Planner, refer to the "MCP (Model Context Protocol) Configuration for Development" section below for instructions on setting up your MCP client.

````json
{
  // ... other configurations ...
  "vibe-planner": {
    "command": "node",
    "args": [
      "/home/youruserhere/projects/cursor-tasklist-mcp/dist/server.js" // Adjust path as necessary
    ],
    "enabled": true,
    "env": {
      "VIBE_PLANNER_PROJECT_ROOT": "/home/youruserhere/projects/cursor-tasklist-mcp", // Adjust path
      "NODE_ENV": "production" // Or "development" if your dev server behaves differently
    }
  }
  // ... other configurations ...
}

## Available Scripts

In the project root directory, you can run the following scripts:

- `yarn build`: Compiles the TypeScript code for the backend API.
- `yarn start`: Starts the production server for the API (requires `yarn build` to be run first).
- `yarn dev`: Starts the backend API in development mode with Nodemon for automatic restarts.
- `yarn test`: Runs backend unit tests using Vitest.
- `yarn start:api`: Starts the API using `ts-node` (useful for quick checks without a full build).
- `yarn dev:api`: Starts the backend API in development mode with Nodemon, specifically watching API and VibePlanner related files.
- `yarn ui:dev`: Runs both the backend API (`dev:api`) and the client-side development server (`client/yarn dev`) concurrently. This is the recommended command for full-stack development and to visualize the Kanban board.
- `yarn db:reset`: Resets the SQLite database.

### Client Scripts

Navigate to the `client/` directory for client-specific scripts. Typically, this will include:

- `yarn dev`: Starts the client-side development server.
- `yarn build`: Builds the client application for production.

## Development Setup

For a full-stack development experience, where you can see the API and the UI (Kanban board) running together:

1.  Ensure all dependencies are installed in both the root and `client/` directories as described in the Installation section.
2.  Open your terminal in the project root directory.
3.  Run the following command:
    ```sh
    yarn ui:dev
    ```
    This will start the backend API and the client development server simultaneously. The API will typically be available at `http://localhost:PORT_API` (check terminal output) and the client at `http://localhost:PORT_CLIENT`.

## Project Structure

````

cursor-tasklist-mcp/
├── client/ # Frontend application
│ ├── src/
│ └── package.json
├── docs/ # General documentation
├── mcp_docs/ # MCP specific documentation
├── src/ # Backend API source code
│ ├── constants/
│ ├── http-api/ # Express API controllers, routes
│ ├── mcp-tools/ # MCP tool definitions
│ ├── services/
│ ├── tools/
│ └── vibeplanner/ # Core VibePlanner logic
├── package.json
├── tsconfig.json
└── vibeplanner.db # SQLite database file

```

## Contributing

Contributions are welcome! Please follow the existing code style and ensure tests pass.

---

This README provides a basic overview. Refer to specific documentation in the `docs/` and `mcp_docs/` folders for more detailed information on architecture and MCP integration.
```
