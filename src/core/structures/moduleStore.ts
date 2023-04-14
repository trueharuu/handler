import type { CommandModule } from '../../types/module';
import type { Processed } from '../../types/handler';

const enum ApplicationCommandType {
    User,
    Message,
    ChatInput
}

const enum ComponentType {
    ActionRow = 1,
    Button = 2,
    StringSelect = 3,
    TextInput = 4,
    UserSelect = 5,
    RoleSelect = 6,
    MentionableSelect = 7,
    ChannelSelect = 8,
}

/**
 * @since 2.0.0
 * Storing all command modules
 * This dependency is usually injected into ModuleManager
 */
export class ModuleStore {
    readonly BothCommands = new Map<string, Processed<CommandModule>>();
    readonly ApplicationCommands = {
        [ApplicationCommandType.User]: new Map<string, Processed<CommandModule>>(),
        [ApplicationCommandType.Message]: new Map<string, Processed<CommandModule>>(),
        [ApplicationCommandType.ChatInput]: new Map<string, Processed<CommandModule>>(),
    };
    readonly ModalSubmit = new Map<string, Processed<CommandModule>>();
    readonly TextCommands = new Map<string, Processed<CommandModule>>();
    readonly InteractionHandlers = {
        [ComponentType.Button]: new Map<string, Processed<CommandModule>>(),
        [ComponentType.StringSelect]: new Map<string, Processed<CommandModule>>(),
        [ComponentType.ChannelSelect]: new Map<string, Processed<CommandModule>>(),
        [ComponentType.MentionableSelect]: new Map<string, Processed<CommandModule>>(),
        [ComponentType.RoleSelect]: new Map<string, Processed<CommandModule>>(),
        [ComponentType.UserSelect]: new Map<string, Processed<CommandModule>>(),
    };
}
