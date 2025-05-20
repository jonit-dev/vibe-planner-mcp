import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';

export const createMockMcpContext = () => {
  return {} as RequestHandlerExtra<ServerRequest, ServerNotification>;
};
