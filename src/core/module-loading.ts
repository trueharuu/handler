import { readdirSync, statSync } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join, basename, resolve } from 'path';
import { type Observable, from, mergeMap } from 'rxjs';
import { SernError } from './structures/errors';
import { type Result, Err, Ok } from 'ts-results-es';
import { Processed } from '../types/handler';
import { Module } from '../types/module';
import * as assert from 'node:assert'
import * as util from 'node:util'

async function* readPath(dir: string): AsyncGenerator<string> {
  try {
    const files = await readdir(dir);
    for (const file of files) {
      const fullPath = join(dir, file);
      const fileStats = await stat(fullPath);
      if (fileStats.isDirectory()) {
        yield* readPath(fullPath);
      } else {
        /// #if MODE === 'esm'
        yield 'file:///'+fullPath;
        /// #elif MODE === 'cjs'
        yield fullPath;
        /// #endif
      }
    }
  } catch (err) {
    throw err;
  }
}


export const fmtFileName = (n: string) => n.substring(0, n.length - 3);

export async function defaultModuleLoader<T extends Module>(
    absPath: string,
): Promise<Result< Processed<T>, SernError>> {
    // prettier-ignore
    let module: T | undefined
    /// #if MODE === 'esm'
    = (await import(absPath)).default
    /// #elif MODE === 'cjs'
    = require(absPath).default; // eslint-disable-line
    /// #endif
    if (module === undefined) {
        return Err(SernError.UndefinedModule);
    }
    try {
        module = new (module as unknown as new () => T)();
    } catch {}
    checkIsProcessed(module)
    return Ok(module);
}

function checkIsProcessed<T extends Module>(m: T): asserts m is Processed<T> {
    assert.ok(m.name !== undefined, `name is not defined for ${util.format(m)}`)
}

/**
 * a directory string is converted into a stream of modules.
 * starts the stream of modules that sern needs to process on init
 * @returns {Observable<{ mod: Module; absPath: string; }[]>} data from command files
 * @param commandDir
 */
export function buildModuleStream<T extends Module >(
    commandDir: string,
): Observable<Result<Processed<T>, SernError>> {
    const commands = getCommands(commandDir);
    return from(commands).pipe(mergeMap(defaultModuleLoader<T>));
}

export function getCommands(dir: string) {
    return readPath(resolve(dir));
}

export function filename(path: string) {
    return fmtFileName(basename(path))
}
//https://stackoverflow.com/questions/16697791/nodejs-get-filename-of-caller-function
export function filePath() {
    const err = new Error();

    Error.prepareStackTrace = (_, stack) => stack;

    const stack = err.stack as unknown as NodeJS.CallSite[];

    Error.prepareStackTrace = undefined;
    const path = stack[2].getFileName();
    if(path === null) {
        throw Error("Could not get the name of commandModule.")
    }
    return path;
}