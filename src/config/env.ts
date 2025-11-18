const {
    NODE_ENV,
    LOG_DEFAULT,
    KEYS_PATH,
    HTTPS,
    SUBGRAPH_INVITATION_URL,
    SUBGRAPH_AUTH_URL,
    PORT,
} = process.env;

export const env = {
    NODE_ENV,
    LOG_DEFAULT,
    KEYS_PATH,
    HTTPS,
    SUBGRAPH_INVITATION_URL,
    SUBGRAPH_AUTH_URL,
    PORT,
} as const;

console.debug('NODE_ENV = %s', NODE_ENV);
console.debug('NODE_ENV = %s', LOG_DEFAULT);
