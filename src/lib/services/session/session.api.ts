import {
  err,
  invalid,
  narrow,
  type Fails,
  type Result,
  type TransportFailure,
} from "../../kernel";
import type { CallOptions, HttpClient } from "../../http";
import { decodeSession, decodeSessions, decodeUser } from "./session.responses";
import {
  MIN_PASSWORD,
  type Credentials,
  type Registration,
  type Session,
  type SessionSummary,
  type User,
} from "./session.types";

/* Takes the client, never imports one — so the whole flow runs against fixtures
 * or a server without a line changing above this tier.
 *
 * # Wrong password is NOT a field error, and the type says so
 *
 * The most useful thing this service demonstrates. A form has two refusals to
 * render and they are different kinds:
 *
 *     invalid          the form is malformed. Carries `fields`, and every
 *                      message belongs beside an input.
 *     unauthenticated  the credentials were wrong. A TRANSPORT kind, so it
 *                      cannot be narrowed away, and it belongs at the top of
 *                      the form because no single field is at fault.
 *
 * Putting "wrong password" on the password field is the common shape and it is
 * a lie — it tells the reader which half was wrong, which is exactly what a
 * sign-in form must not do. */

export type SignInFailure = TransportFailure | Fails<"invalid">;
export type SignUpFailure = TransportFailure | Fails<"invalid" | "conflict">;
export type RevokeFailure = TransportFailure | Fails<"not_found" | "conflict">;

const asSignIn = narrow("invalid");
const asSignUp = narrow("invalid", "conflict");
const asRevoke = narrow("not_found", "conflict");

/* Promises NO domain kind: every one of them folds to `internal` with the
   original as cause. `narrow<never>()` rather than `narrow()`, because with no
   argument the parameter infers as the whole domain union and the signature
   would quietly widen back to what it is meant to exclude. */
const asTransport = narrow<never>();

/* Client-side checks produce the SAME shape the server would, so a form renders
   one branch rather than two — and moving a rule across the wire later changes
   nothing above this line. */
/* Trimmed ONCE, and the trimmed value is both what is checked and what is sent.
   Checking the raw string and sending the raw string means a trailing space is
   rejected here as malformed while the server would have accepted it — the two
   ends disagreeing about the same address, which shows up as a form that
   refuses an address the user can see is fine.

   Trim only, never lowercase: matching case-insensitively is the server's job,
   and lowercasing on the way out would throw away how somebody writes their own
   name. */
const emailProblem = (email: string): string | undefined =>
  !email
    ? "An email address is required."
    : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
      ? "That does not look like an email address."
      : undefined;

export async function signIn(
  client: HttpClient,
  credentials: Credentials,
  options?: CallOptions,
): Promise<Result<Session, SignInFailure>> {
  const email = credentials.email.trim();
  const fields: Record<string, string> = {};
  const problem = emailProblem(email);
  if (problem) fields.email = problem;
  if (!credentials.password) fields.password = "Enter your password.";
  if (Object.keys(fields).length)
    return err(invalid("Check the form.", fields));

  return (
    await client.post<unknown>("/auth/sign-in", {
      body: { email, password: credentials.password },
      signal: options?.signal,
      trace: options?.trace,
    })
  )
    .andThen((value) => decodeSession(value, options?.trace))
    .mapErr(asSignIn);
}

export async function signUp(
  client: HttpClient,
  registration: Registration,
  options?: CallOptions,
): Promise<Result<Session, SignUpFailure>> {
  const name = registration.name.trim();
  const email = registration.email.trim();
  const fields: Record<string, string> = {};
  if (!name) fields.name = "A name is required.";
  const problem = emailProblem(email);
  if (problem) fields.email = problem;
  if (registration.password.length < MIN_PASSWORD) {
    fields.password = `At least ${MIN_PASSWORD} characters.`;
  }
  if (Object.keys(fields).length)
    return err(invalid("Check the form.", fields));

  return (
    await client.post<unknown>("/auth/sign-up", {
      body: { name, email, password: registration.password },
      signal: options?.signal,
      trace: options?.trace,
    })
  )
    .andThen((value) => decodeSession(value, options?.trace))
    .mapErr(asSignUp);
}

/** Who the bearer belongs to.
 *
 *  Fails with `unauthenticated` when the token is missing, expired or unknown —
 *  a transport kind, so no caller can declare it away, which is the point. A
 *  layout guarding a route reads that one branch and redirects. */
export async function currentUser(
  client: HttpClient,
  options?: CallOptions,
): Promise<Result<User, TransportFailure>> {
  return (
    await client.get<unknown>("/auth/me", {
      signal: options?.signal,
      trace: options?.trace,
    })
  )
    .andThen((value) => decodeUser(value, options?.trace))
    .mapErr(asTransport);
}

/** Everywhere this account is signed in, newest first.
 *
 *  A read that can genuinely be slow, refused or — once the current session is
 *  excluded — empty, which is what makes it the screen where all three states
 *  are reachable rather than modelled.
 *
 *  It returns the list including the current session. Whether "only this one"
 *  reads as *empty* is a display decision and belongs at the render, not here:
 *  a caller listing other devices wants emptiness, a caller listing all
 *  sessions never sees it. */
export async function listSessions(
  client: HttpClient,
  options?: CallOptions,
): Promise<Result<SessionSummary[], TransportFailure>> {
  return (
    await client.get<unknown>("/auth/sessions", {
      signal: options?.signal,
      trace: options?.trace,
    })
  )
    .andThen((value) => decodeSessions(value, options?.trace))
    .mapErr(asTransport);
}

/** Ends ANOTHER session — the write behind "sign out this device".
 *
 *  Two domain kinds, declared, because both are answers a caller must render
 *  differently:
 *
 *      not_found   it is already gone. An optimistic removal was RIGHT, and
 *                  rolling it back would put a dead row back on screen.
 *      conflict    it is the session making the request. Signing yourself out
 *                  is a different operation with different consequences, and
 *                  quietly doing it here would surprise somebody.
 *
 *  Anything else folds to `internal` and keeps its cause, which is the contract
 *  `narrow` enforces at runtime. */
export async function revokeSession(
  client: HttpClient,
  id: string,
  options?: CallOptions,
): Promise<Result<null, RevokeFailure>> {
  return (
    await client.delete<unknown>(`/auth/sessions/${encodeURIComponent(id)}`, {
      signal: options?.signal,
      trace: options?.trace,
    })
  )
    .map(() => null)
    .mapErr(asRevoke);
}

/** Ends the session on the server. The CALLER still has to forget the token —
 *  this cannot reach the cookie, and pretending otherwise is how a sign-out
 *  succeeds while the browser stays signed in. */
export async function signOut(
  client: HttpClient,
  options?: CallOptions,
): Promise<Result<null, TransportFailure>> {
  return (
    await client.post<unknown>("/auth/sign-out", {
      signal: options?.signal,
      trace: options?.trace,
    })
  )
    .map(() => null)
    .mapErr(asTransport);
}
