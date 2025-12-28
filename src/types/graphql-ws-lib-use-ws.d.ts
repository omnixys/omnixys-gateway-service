// types/graphql-ws-lib-use-ws.d.ts
declare module 'graphql-ws/lib/use/ws' {
  import type { WebSocketServer } from 'ws';
  import type { GraphQLSchema } from 'graphql';

  export interface ServerOptions {
    schema: GraphQLSchema;
  }

  export function useServer(
    options: ServerOptions,
    wsServer: WebSocketServer,
  ): {
    dispose: () => Promise<void>;
  };
}
