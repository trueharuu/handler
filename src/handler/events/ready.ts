import { ObservableInput, fromEvent, of, take } from 'rxjs';
import { callInitPlugins } from './observableHandling';
import { CommandType } from '../../core/structures';
import { SernError } from '../../core/structures/errors';
import { Result } from 'ts-results-es';
import type { ModuleManager } from '../../core/contracts';
import { SernEmitter, PlatformStrategy, DispatchType } from '../../core';
import { sernMeta } from '../../commands';
import { Processed, ServerlessDependencyList, WebsocketDependencyList } from '../../types/core';
import { Module } from '../../types/module';
import * as assert from 'node:assert';
import { buildModules } from './generic';

export function startReadyEvent(
    [sEmitter, errorHandler, , moduleManager, client]:
        | ServerlessDependencyList
        | WebsocketDependencyList,
    input: ObservableInput<string>,
) {
    const ready$ = fromEvent(client!, 'interactionCreate').pipe(take(1));
    return ready$
        .pipe(
            buildModules(input, sEmitter),
            callInitPlugins({
                onStop: module => {
                    sEmitter.emit(
                        'module.register',
                        SernEmitter.failure(module, SernError.PluginFailure),
                    );
                },
                onNext: ({ module }) => {
                    sEmitter.emit('module.register', SernEmitter.success(module));
                    return module;
                },
            }),
        )
        .subscribe(module => {
            const result = registerModule(moduleManager, module as Processed<Module>);
            if (result.err) {
                errorHandler.crash(Error(SernError.InvalidModuleType));
            }
        });
}

function registerModule<T extends Processed<Module>>(
    manager: ModuleManager,
    module: T,
): Result<void, void> {
    const { id, fullPath } = module[sernMeta];
    if (module.type === CommandType.Both || module.type === CommandType.Text) {
        assert.ok('alias' in module);
        assert.ok(Array.isArray(module.alias));
        module.alias?.forEach(a => manager.set(`${a}__A0`, fullPath));
    }
    return Result.wrap(() => manager.set(id, fullPath));
}
