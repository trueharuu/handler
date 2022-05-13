import type { Message } from 'discord.js';
import { Observable, throwError } from 'rxjs';
import type { ModuleDefs } from '../structures/modules/commands/moduleHandler';
import { SernError } from '../structures/errors';
import { isNotFromBot } from '../utilities/messageHelpers';
import type { PluggedModule } from '../structures/modules/module';
import type { SernPlugin } from '../plugins/plugin';

export function correctModuleType<T extends keyof ModuleDefs>(
    plug: PluggedModule | undefined,
    type: T,
): plug is { mod: ModuleDefs[T]; plugins: SernPlugin[] } {
    return plug !== undefined && plug.mod.type === type;
}

export function filterCorrectModule<T extends keyof ModuleDefs>(cmdType: T) {
    return (src: Observable<PluggedModule | undefined>) =>
        new Observable<{ mod: ModuleDefs[T]; plugins: SernPlugin[] }>(subscriber => {
            return src.subscribe({
                next(plug) {
                    if (correctModuleType(plug, cmdType)) {
                        subscriber.next({ mod: plug.mod, plugins: plug.plugins });
                    } else {
                        if (plug === undefined) {
                            return throwError(() => SernError.UndefinedModule);
                        }
                        return throwError(() => SernError.MismatchModule);
                    }
                },
                error: e => subscriber.error(e),
                complete: () => subscriber.complete(),
            });
        });
}

/** export function filterTap<T extends keyof ModuleDefs>(
 cmdType : T,
 tap: (mod : ModuleDefs[T], plugins : EventPlugin[]) => Awaitable<void>
 ) {
    return (src : Observable<PluggedModule|undefined>) => 
        new Observable<PluggedModule|undefined>( subscriber => { 
            return src.subscribe({ 
                next(modul) {
                    if(match(modul, cmdType)) {
                       const asModT = <ModuleDefs[T]> modul!.mod; 
                       tap(asModT, modul!.plugins as EventPlugin[]);
                       subscriber.next(modul);
                    } else {
                       if (modul === undefined) { 
                          return throwError(() => SernError.UndefinedModule); 
                       }
                       return throwError(() => SernError.MismatchModule);
                    }
                },
                error: (e) =>  subscriber.error(e),
                complete: () => subscriber.complete()
            });
        });
  }
 **/
export function ignoreNonBot(prefix: string) {
    return (src: Observable<Message>) =>
        new Observable<Message>(subscriber => {
            return src.subscribe({
                next(m) {
                    const passAll = [
                        isNotFromBot,
                        (m: Message) =>
                            m.content
                                .slice(0, prefix.length)
                                .localeCompare(prefix, undefined, { sensitivity: 'accent' }) === 0,
                    ].every(fn => fn(m));

                    if (passAll) {
                        subscriber.next(m);
                    }
                },
                error: e => subscriber.error(e),
                complete: () => subscriber.complete(),
            });
        });
}

export function partition<T, U extends T>(condition: (el: T) => el is U, array: T[]): [U[], T[]] {
    const uArr: U[] = [];
    const vArr: T[] = [];
    for (const el of array) {
        (condition(el) ? uArr : vArr).push(el);
    }
    return [uArr, vArr];
}