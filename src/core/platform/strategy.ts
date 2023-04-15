import { Context } from "../structures/context";

enum DispatchType {
    Websocket,
    Serverless
}

export type PlatformStrategy =
    | WebsocketStrategy
    | ServerlessStrategy;

interface WebsocketStrategy {
    type: DispatchType.Websocket;
    interactionCreate: string;
    messageCreate: string;
    ready: string;
}

interface ServerlessStrategy {
    type: DispatchType.Serverless;
}