# REST Client Files for API Testing

This folder contains `.http` files that can be used with REST client extensions (like the "REST Client" extension in VS Code by Huachao Mao) to test the API endpoints of the VibePlanner application.

## Prerequisites

1.  Ensure the VibePlanner API server is running (e.g., using `yarn dev:api`). By default, it should be accessible at `http://localhost:3000`.
2.  Have a REST client extension installed in your code editor.

## How to Use

1.  Open one of the `.http` files (e.g., `plans.http`).
2.  You should see a "Send Request" link above each HTTP request block.
3.  Click "Send Request" to execute the API call.
4.  The response will be displayed in a separate pane.

## Variables

Some requests might use variables (e.g., `{{planId}}`). You might need to:

- Manually replace these placeholders with actual values obtained from previous requests (e.g., copy the `id` from a created plan).
- Or, if your REST client supports it, define environment variables. For the "REST Client" extension, you can create a `rest-client.env.json` or use workspace settings. For example:

  ```json
  // Example for .vscode/settings.json or a dedicated environment file
  {
    "rest-client.environmentVariables": {
      "$shared": {
        // Shared across all .http files
        "baseUrl": "http://localhost:3000/api"
      },
      "local": {
        // Specific environment
        "planId": "your-actual-plan-id-here"
      }
    }
  }
  ```

  Then you could write requests like `GET {{baseUrl}}/plans/{{planId}}`.

  For simplicity, the provided files use full URLs and expect manual replacement of IDs for now.

## Files

- `plans.http`: Contains requests for managing PRDs/plans.
