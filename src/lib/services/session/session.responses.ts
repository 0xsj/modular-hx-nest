import {
  responseArray,
  responseDecoder,
  responseObject,
  responseText,
  responseTimestamp,
} from "../../http";
import type { Session, SessionSummary, User } from "./session.types";

function readUser(value: unknown): User | undefined {
  const user = responseObject(value);
  if (
    !user ||
    !responseText(user.id) ||
    !responseText(user.name) ||
    !responseText(user.email)
  )
    return undefined;
  return { id: user.id, name: user.name, email: user.email };
}

function readSession(value: unknown): Session | undefined {
  const session = responseObject(value);
  if (!session || !responseText(session.token)) return undefined;
  const user = readUser(session.user);
  return user ? { token: session.token, user } : undefined;
}

function readSessionSummary(value: unknown): SessionSummary | undefined {
  const session = responseObject(value);
  if (
    !session ||
    !responseText(session.id) ||
    !responseTimestamp(session.createdAt) ||
    typeof session.current !== "boolean"
  )
    return undefined;
  return {
    id: session.id,
    createdAt: session.createdAt,
    current: session.current,
  };
}

export const decodeUser = responseDecoder("user", readUser);
export const decodeSession = responseDecoder("session", readSession);
export const decodeSessions = responseDecoder(
  "session list",
  responseArray(readSessionSummary),
);
