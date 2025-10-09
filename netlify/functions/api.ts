import serverless from "serverless-http";
import { createServer } from "../../server";

const server = createServer();
export const handler = serverless(server);
