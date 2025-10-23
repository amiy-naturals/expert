import serverless from "serverless-http";
import { createServer } from "../../server";

const server = createServer();

// Configure serverless-http to properly handle request body
export const handler = serverless(server, {
  // Ensure the body is passed through correctly
  basePath: "",
  binary: ["application/octet-stream", "image/jpeg", "image/png", "image/gif"],
});
