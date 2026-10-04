import { jest } from '@jest/globals';

/**
 * Socket is imported dynamically rather than statically, because the whole
 * point of the first test is to observe what module evaluation itself does.
 * The stubs below have to be installed before the module is evaluated, and a
 * static import would be hoisted above them.
 *
 * The module exports a singleton rather than the class, so these tests share
 * one instance and run in declaration order: the attach-nothing cases come
 * before the case that attaches.
 */

const documentListeners: string[] = [];
const windowListeners: string[] = [];

class FakeWebSocket {
  static readonly CONNECTING = 0;

  static readonly OPEN = 1;

  static readonly CLOSING = 2;

  static readonly CLOSED = 3;

  public readonly CLOSED = FakeWebSocket.CLOSED;

  public readonly OPEN = FakeWebSocket.OPEN;

  public readyState: number = FakeWebSocket.CONNECTING;

  public readonly url: string;

  public constructor(url: string) {
    this.url = url;
  }

  public addEventListener(): void {}

  public send(): void {}

  public close(): void {
    this.readyState = FakeWebSocket.CLOSED;
  }
}

// Cast once at the boundary: Socket only reads addEventListener,
// visibilityState and location.protocol, so a full Document/Window stand-in is
// not worth building.
global.document = {
  addEventListener: (type: string) => documentListeners.push(type),
  visibilityState: 'visible',
} as unknown as Document;

global.window = {
  addEventListener: (type: string) => windowListeners.push(type),
  location: { protocol: 'https:' },
} as unknown as Window & typeof globalThis;

global.WebSocket = FakeWebSocket as unknown as typeof WebSocket;

type SocketModule = typeof import('../../src/Kontororu/Socket.js');

describe('socket lifecycle listeners', () => {
  let socket: SocketModule['socket'];
  let attachedOnImport: { document: number; window: number };

  beforeAll(async () => {
    ({ socket } = await import('../../src/Kontororu/Socket.js'));

    attachedOnImport = {
      document: documentListeners.length,
      window: windowListeners.length,
    };
  });

  test('importing the module attaches no listeners', () => {
    // Guards the tree-shaking contract declared by "sideEffects": false in
    // package.json: if constructing the singleton registers listeners, every
    // consumer's bundler has to keep this module even when unused.
    expect(attachedOnImport).toEqual({ document: 0, window: 0 });
  });

  test('a connect() rejected for a missing session_id attaches no listeners', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    socket.connect('', { hostname: 'example.com', path: 'ws' });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(documentListeners).toHaveLength(0);
    expect(windowListeners).toHaveLength(0);

    warn.mockRestore();
  });

  test('the first connect() attaches the visibility and connectivity listeners', () => {
    socket.connect('session-1', { hostname: 'example.com', path: 'ws' });

    expect(documentListeners).toEqual(['visibilitychange']);
    expect(windowListeners).toEqual(['online', 'offline']);
  });

  test('reconnecting does not attach a second copy of each listener', () => {
    // disconnect() clears the socket, so this reaches the attach path again
    // rather than returning early on an already-open connection.
    socket.disconnect();
    socket.connect('session-1');

    expect(documentListeners).toEqual(['visibilitychange']);
    expect(windowListeners).toEqual(['online', 'offline']);
  });
});
