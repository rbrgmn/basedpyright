/*
 * fileSystem.ts
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT license.
 *
 * A "file system provider" abstraction that allows us to swap out a
 * real file system implementation for a virtual (mocked) implementation
 * for testing.
 */

// * NOTE * except tests, this should be only file that import "fs"
import type * as fs from 'fs';
import { FileWatcher, FileWatcherEventHandler } from './fileWatcher';
import { Uri } from './uri/uri';

export interface Stats {
    size: number;
    mtimeMs: number;

    isFile(): boolean;
    isDirectory(): boolean;
    isBlockDevice(): boolean;
    isCharacterDevice(): boolean;
    isSymbolicLink(): boolean;
    isFIFO(): boolean;
    isSocket(): boolean;
    isZipDirectory?: () => boolean;
}

export interface MkDirOptions {
    recursive: boolean;
    // Not supported on Windows so commented out.
    // mode: string | number;
}

export type MaybeThenable<T> = Thenable<T> | T;

export interface ReadOnlyFileSystem {
    exists(uri: Uri): MaybeThenable<boolean>;
    chdir(uri: Uri): void;
    readdirEntriesSync(uri: Uri): fs.Dirent[];
    readdirSync(uri: Uri): string[];

    stat(uri: Uri): MaybeThenable<Stats>;
    realpathSync(uri: Uri): Uri;
    getModulePath(): Uri;
    // Async I/O
    readFile(uri: Uri): Promise<Buffer>;
    readFileText(uri: Uri, encoding?: BufferEncoding): Promise<string>;
    // Return path in casing on OS.
    realCasePath(uri: Uri): Uri;

    // See whether the file is mapped to another location.
    isMappedUri(uri: Uri): boolean;

    // Get original uri if the given uri is mapped.
    getOriginalUri(mappedUri: Uri): Uri;

    // Get mapped uri if the given uri is mapped.
    getMappedUri(originalUri: Uri): Uri;

    isInZip(uri: Uri): boolean;
}

export interface FileSystem extends ReadOnlyFileSystem {
    mkdir(uri: Uri, options?: MkDirOptions): MaybeThenable<void>;
    writeFile(uri: Uri, data: string | Buffer, encoding: BufferEncoding | null): MaybeThenable<void>;

    unlink(uri: Uri): MaybeThenable<void>;
    rmdirSync(uri: Uri): void;

    createFileSystemWatcher(uris: Uri[], listener: FileWatcherEventHandler): FileWatcher;
    createReadStream(uri: Uri): fs.ReadStream;
    createWriteStream(uri: Uri): fs.WriteStream;
    copyFile(uri: Uri, dst: Uri): MaybeThenable<void>;
}

export interface TmpfileOptions {
    postfix?: string;
    prefix?: string;
}

export interface TempFile {
    // The directory returned by tmpdir must exist and be the same each time tmpdir is called.
    tmpdir(): Uri;
    tmpfile(options?: TmpfileOptions): Uri;
    dispose(): void;
}

export namespace FileSystem {
    export function is(value: any): value is FileSystem {
        return value.createFileSystemWatcher && value.createReadStream && value.createWriteStream && value.copyFileSync;
    }
}

export namespace TempFile {
    export function is(value: any): value is TempFile {
        return value.tmpdir && value.tmpfile && value.dispose;
    }
}

export class VirtualDirent implements fs.Dirent {
    constructor(public name: string, private _file: boolean) {}

    isFile(): boolean {
        return this._file;
    }

    isDirectory(): boolean {
        return !this._file;
    }

    isBlockDevice(): boolean {
        return false;
    }

    isCharacterDevice(): boolean {
        return false;
    }

    isSymbolicLink(): boolean {
        return false;
    }

    isFIFO(): boolean {
        return false;
    }

    isSocket(): boolean {
        return false;
    }
}
