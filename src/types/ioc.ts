import { Container, UnpackFunction } from 'iti';
import * as Contracts from '../core/contracts'

export type Singleton<T> = () => T;
export type Transient<T> = () => () => T;


export type DependencyList = [
    Contracts.Emitter,
    Contracts.ErrorHandling,
    Contracts.Logging | undefined,
    Contracts.ModuleManager,
    Contracts.Emitter,
];

export interface CoreDependencies {
    '@sern/client': () => Contracts.Emitter
    '@sern/logger'?: () => Contracts.Logging;
    '@sern/emitter': () => Contracts.Emitter;
    '@sern/store': () => Contracts.CoreModuleStore;
    '@sern/modules': () => Contracts.ModuleManager;
    '@sern/errors': () => Contracts.ErrorHandling;
}

export type DependencyFromKey<T extends keyof Dependencies> = Dependencies[T];

export type IntoDependencies<Tuple extends [...any[]]> = {
    [Index in keyof Tuple]: UnpackFunction<NonNullable<DependencyFromKey<Tuple[Index]>>>; //Unpack and make NonNullable
} & { length: Tuple['length'] };

export interface DependencyConfiguration {
    //@deprecated. Loggers will always be included in the future
    exclude?: Set<'@sern/logger'>;
    build: (root: Container<Omit<CoreDependencies, '@sern/client'>, {}>) => Container<Dependencies, {}>;
}
