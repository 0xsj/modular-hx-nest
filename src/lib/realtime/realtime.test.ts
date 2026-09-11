import { afterEach, describe, expect, it, vi } from "vitest";
import { err, invalid, ok } from "../kernel";
import { createMemorySource, createWebSocketSource } from ".";

const observer = () => ({ event: vi.fn(), state: vi.fn(), error: vi.fn() });
class Socket extends EventTarget {
  close = vi.fn();
  open() {
    this.dispatchEvent(new Event("open"));
  }
  message(data: unknown) {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }
  end(code = 1006) {
    this.dispatchEvent(new CloseEvent("close", { code }));
  }
}
const decode = (value: unknown) =>
  typeof value === "number" ? ok(value) : err(invalid("Not a number", {}));
afterEach(() => {
  vi.useRealTimers();
});

describe("socket subscriptions", () => {
  it("connects lazily, maps envelopes, reports bad messages, and releases every listener", () => {
    const socket = new Socket(),
      factory = vi.fn(() => socket as unknown as WebSocket);
    const source = createWebSocketSource({
      url: () => "wss://example.test/events",
      decode,
      socket: factory,
    });
    expect(factory).not.toHaveBeenCalled();
    const sink = observer(),
      stop = source.subscribe(sink);
    expect(sink.state).toHaveBeenLastCalledWith({ state: "connecting" });
    socket.open();
    expect(sink.state).toHaveBeenLastCalledWith({
      state: "open",
      reconnected: false,
    });
    socket.message("3");
    expect(sink.event).toHaveBeenLastCalledWith(3);
    socket.message("bad JSON");
    socket.message('"wrong shape"');
    expect(sink.error).toHaveBeenCalledTimes(2);
    expect(sink.event).toHaveBeenCalledTimes(1);
    stop();
    socket.message("4");
    socket.open();
    expect(socket.close).toHaveBeenCalledTimes(1);
    expect(sink.event).toHaveBeenCalledTimes(1);
    expect(sink.state).toHaveBeenCalledTimes(2);
  });
  it("reconnects abnormal closes with bounded backoff and marks a later open for resync", () => {
    vi.useFakeTimers();
    const sockets: Socket[] = [];
    const factory = vi.fn(() => {
      const socket = new Socket();
      sockets.push(socket);
      return socket as unknown as WebSocket;
    });
    const sink = observer();
    const stop = createWebSocketSource({
      url: () => "ws://localhost",
      decode,
      socket: factory,
      retry: { attempts: 3, baseMs: 10, maxMs: 15 },
    }).subscribe(sink);
    sockets[0].open();
    sockets[0].end();
    expect(sink.state).toHaveBeenLastCalledWith(
      expect.objectContaining({ state: "reconnecting", retryInMs: 10 }),
    );
    vi.advanceTimersByTime(10);
    sockets[1].end();
    expect(sink.state).toHaveBeenLastCalledWith(
      expect.objectContaining({ retryInMs: 15 }),
    );
    vi.advanceTimersByTime(15);
    sockets[2].open();
    expect(sink.state).toHaveBeenLastCalledWith({
      state: "open",
      reconnected: true,
    });
    sockets[0].message("5");
    expect(sink.event).not.toHaveBeenCalled();
    stop();
  });
  it.each([1000, 1008, 4401])(
    "does not retry deliberate/policy close %s",
    (code) => {
      vi.useFakeTimers();
      const socket = new Socket(),
        factory = vi.fn(() => socket as unknown as WebSocket),
        sink = observer();
      const stop = createWebSocketSource({
        url: () => "ws://localhost",
        decode,
        socket: factory,
      }).subscribe(sink);
      socket.end(code);
      vi.runAllTimers();
      expect(factory).toHaveBeenCalledTimes(1);
      expect(sink.state).toHaveBeenLastCalledWith(
        expect.objectContaining({ state: "closed" }),
      );
      stop();
    },
  );
  it("bounds constructor failures and cancels scheduled reconnects on unsubscribe", () => {
    vi.useFakeTimers();
    const factory = vi.fn(() => {
      throw new Error("offline");
    });
    const source = createWebSocketSource({
      url: () => "ws://localhost",
      decode,
      socket: factory,
      retry: { attempts: 2, baseMs: 1, maxMs: 2 },
    });
    const sink = observer();
    source.subscribe(sink);
    vi.runAllTimers();
    expect(factory).toHaveBeenCalledTimes(3);
    expect(sink.state).toHaveBeenLastCalledWith(
      expect.objectContaining({ state: "closed" }),
    );
    const stop = source.subscribe(observer());
    stop();
    vi.runAllTimers();
    expect(factory).toHaveBeenCalledTimes(4);
  });
});

it("memory events are missed during disconnection and subscriptions clean up", () => {
  const source = createMemorySource<number>(),
    sink = observer(),
    stop = source.subscribe(sink);
  source.publish(1);
  source.disconnect();
  source.publish(2);
  source.reconnect();
  expect(sink.event).toHaveBeenCalledTimes(1);
  expect(sink.state).toHaveBeenLastCalledWith({
    state: "open",
    reconnected: true,
  });
  source.publish(3);
  stop();
  source.publish(4);
  expect(sink.event).toHaveBeenCalledTimes(2);
});
