import {
  conflict,
  err,
  invalid,
  notFound,
  ok,
  rateLimited,
  unauthenticated,
  type Failure,
  type Result,
} from "../../kernel";
import { requireToken, type MemoryRoute } from "../../http";
import { record } from "../ledger";
import {
  MIN_PASSWORD,
  type Session,
  type SessionSummary,
  type User,
} from "./session.types";

/* The routes that make the whole flow run with no server.
 *
 * Beside the service rather than in `lib/root`, for the reason that tier states:
 * its own table ships EMPTY, and a caller with fixtures passes them in. The
 * contract is the service's, so the thing that reproduces it belongs here.
 *
 * # Refusals first
 *
 * A fixture that only serves the happy path builds every screen against a
 * contract nobody serves. Four routes succeed here and four ways of being told
 * no are reproduced: wrong credentials, an email already taken, a malformed
 * body, and — after enough wrong guesses — a rate limit carrying a retry-after,
 * which is the one refusal a screen is supposed to act on rather than report.
 *
 * # It writes to the ledger, because a server would
 *
 * An audit entry is a side effect of an operation, written by the thing that
 * performed it. So these routes call `record` and the ledger tier owns the log:
 * the dependency runs one way, and nothing in the ledger knows what a session
 * is. The consequence is that the activity screen shows what actually happened
 * rather than a list of invented rows — sign in, and the row is yours.
 *
 * # The store is process-lifetime, and that is a real limit
 *
 * A `Map` in a module. It survives requests inside one process, which is what
 * makes "sign up, then sign in" work in development, and it does NOT survive a
 * rebuild, a restart, or a second instance. Nothing here should ever be the
 * reason a product's data model looks like this: a product replaces the whole
 * file the day its first endpoint exists. */

type StoredUser = User & { password: string };
type StoredSession = {
  id: string;
  userId: string;
  token: string;
  createdAt: number;
};

const users = new Map<string, StoredUser>();
const sessions = new Map<string, StoredSession>();
const failedAttempts = new Map<string, number>();

/** Enough wrong guesses and the server stops answering the question. */
const ATTEMPT_LIMIT = 5;
const RETRY_AFTER_SECONDS = 30;

/** Sessions EXPIRE, because real ones do.
 *
 *  The single most common live-API behaviour a fixture omits, and the one that
 *  breaks applications: everything works for an hour and then every read is a
 *  401 at once. A fixture whose tokens live forever means the guard's redirect,
 *  the cache's error branch and the sign-in round trip are all paths nobody has
 *  walked before a real user does.
 *
 *  Long enough not to interrupt, short enough to meet. Set
 *  `FLOVER_SESSION_TTL_MS` to something small to watch it happen. */
const ttlMs = (): number =>
  Number(process.env.FLOVER_SESSION_TTL_MS) || 30 * 60 * 1000;

const isExpired = (session: StoredSession): boolean =>
  Date.now() - session.createdAt > ttlMs();

/** Reads the session behind a token, and treats an expired one as absent.
 *
 *  Sweeping it out on read rather than on a timer, which is what a server with
 *  a TTL index does and what makes "it worked a minute ago" reproducible. */
function liveSession(token: string): StoredSession | undefined {
  const session = sessions.get(token);
  if (!session) return undefined;
  if (!isExpired(session)) return session;
  sessions.delete(token);
  return undefined;
}

const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `id-${Math.random().toString(36).slice(2, 10)}`;

const normalise = (email: string) => email.trim().toLowerCase();

/** One account, so the flow is walkable the moment the app boots. A template
 *  whose demo requires signing up first has a worse first minute. */
export const DEMO_CREDENTIALS = {
  email: "ada@example.com",
  password: "password",
};

function seed(): void {
  if (users.size) return;
  users.set(normalise(DEMO_CREDENTIALS.email), {
    id: "u_ada",
    name: "Ada Lovelace",
    email: DEMO_CREDENTIALS.email,
    password: DEMO_CREDENTIALS.password,
  });
}

/** Only for tests, which need a store that does not carry across cases. */
export function resetSessionFixtures(): void {
  users.clear();
  sessions.clear();
  failedAttempts.clear();
  seed();
}

const issue = (user: StoredUser): Session => {
  const token = `tok_${newId()}`;
  sessions.set(token, {
    id: `ses_${newId()}`,
    userId: user.id,
    token,
    createdAt: Date.now(),
  });
  return { token, user: { id: user.id, email: user.email, name: user.name } };
};

const byId = (id: string): StoredUser | undefined =>
  [...users.values()].find((u) => u.id === id);

/* A body arriving as `unknown` is read once, here, and never trusted. The
   service validated its own input; this is the SERVER's copy of that job, and
   reproducing it is the point — a fixture that skips it lets a screen ship
   against a server that would have refused. */
function readBody(body: unknown): Record<string, unknown> {
  return body && typeof body === "object"
    ? (body as Record<string, unknown>)
    : {};
}
const str = (v: unknown): string => (typeof v === "string" ? v : "");

export const sessionRoutes: MemoryRoute[] = [
  {
    method: "POST",
    pattern: /^\/auth\/sign-in$/,
    /* Slower than the reads, and deliberately: a real credential check hashes a
       password, so a sign-in form laid out against a 60ms fixture has never
       shown its own pending state to anybody. */
    latencyMs: { min: 320, max: 700 },
    handle: (req): Result<Session, Failure> => {
      seed();
      const body = readBody(req.body);
      const email = normalise(str(body.email));
      const password = str(body.password);

      if (!email || !password) {
        return err(
          invalid(
            "Check the form.",
            {
              ...(email ? {} : { email: "An email address is required." }),
              ...(password ? {} : { password: "Enter your password." }),
            },
            { status: 422 },
          ),
        );
      }

      if ((failedAttempts.get(email) ?? 0) >= ATTEMPT_LIMIT) {
        return err(
          rateLimited(
            "Too many attempts. Try again shortly.",
            RETRY_AFTER_SECONDS,
            { status: 429 },
          ),
        );
      }

      const user = users.get(email);
      if (!user || user.password !== password) {
        const attempt = (failedAttempts.get(email) ?? 0) + 1;
        failedAttempts.set(email, attempt);
        /* A refused sign-in is the entry somebody actually reads a log for.
           The ACTOR is anonymous — the request arrived unauthenticated, and
           back-filling the account it was aimed at would put a name on an act
           that account did not perform. */
        record({
          scope: "session",
          action: "session.sign_in_failed",
          subject: email,
          actor: "anonymous",
          correlationId: req.correlationId,
          detail: { reason: "wrong_password", attempt },
        });
        /* One message for both halves, deliberately. "No such account" tells
           anybody who asks which addresses are registered. */
        return err(
          unauthenticated("That email and password do not match.", {
            status: 401,
          }),
        );
      }

      failedAttempts.delete(email);
      record({
        scope: "session",
        action: "session.signed_in",
        subject: user.email,
        actor: user.email,
        correlationId: req.correlationId,
        detail: {},
      });
      return ok(issue(user));
    },
  },

  {
    method: "POST",
    pattern: /^\/auth\/sign-up$/,
    latencyMs: { min: 380, max: 800 },
    handle: (req): Result<Session, Failure> => {
      seed();
      const body = readBody(req.body);
      const email = normalise(str(body.email));
      const name = str(body.name).trim();
      const password = str(body.password);

      const fields: Record<string, string> = {};
      if (!name) fields.name = "A name is required.";
      if (!email) fields.email = "An email address is required.";
      if (password.length < MIN_PASSWORD)
        fields.password = `At least ${MIN_PASSWORD} characters.`;
      if (Object.keys(fields).length)
        return err(invalid("Check the form.", fields, { status: 422 }));

      /* A taken email is a CONFLICT, not an invalid field. The form was
         well-formed; the world disagreed with it. A screen may still render it
         beside the email input — that is the screen's decision, and it is a
         different one from the type's. */
      if (users.has(email)) {
        return err(
          conflict("An account with that email already exists.", {
            status: 409,
          }),
        );
      }

      const user: StoredUser = {
        id: `u_${newId()}`,
        name,
        email: str(body.email).trim(),
        password,
      };
      users.set(email, user);
      /* `anonymous`, and that is correct: the request arrived unauthenticated,
         so the row says so rather than naming the account it went on to
         create. A screen renders it as "not signed in" — never blank, and never
         the new account's own name. */
      record({
        scope: "account",
        action: "account.created",
        subject: user.email,
        actor: "anonymous",
        correlationId: req.correlationId,
        detail: { via: "sign-up" },
      });
      record({
        scope: "session",
        action: "session.signed_in",
        subject: user.email,
        actor: user.email,
        correlationId: req.correlationId,
        detail: {},
      });
      return ok(issue(user));
    },
  },

  {
    method: "POST",
    pattern: /^\/auth\/sign-out$/,
    handle: (req): Result<null, Failure> => {
      const ending = req.token ? sessions.get(req.token) : undefined;
      if (ending) {
        const user = byId(ending.userId);
        record({
          scope: "session",
          action: "session.signed_out",
          subject: ending.id,
          actor: user?.email ?? "unknown",
          correlationId: req.correlationId,
          detail: {},
        });
      }
      if (req.token) sessions.delete(req.token);
      /* Succeeds whether or not there was a session. Signing out is the one
         operation a caller must never be blocked from completing. */
      return ok(null);
    },
  },

  {
    method: "GET",
    pattern: /^\/auth\/me$/,
    handle: (req): Result<User, Failure> => {
      seed();
      const token = requireToken(req);
      // `Err` is generic in its value type too, so the guard has to rebuild it
      // rather than pass it through — the one place this shape costs a line.
      if (!token.ok) return err(token.error);

      const session = liveSession(token.value);
      const user = session ? byId(session.userId) : undefined;
      /* An unknown token is `unauthenticated`, never `not_found`. The thing
         that was not found is the session, and "who are you" has one answer
         when the answer is nobody. */
      if (!user)
        return err(
          unauthenticated("That session has expired.", { status: 401 }),
        );

      return ok({ id: user.id, email: user.email, name: user.name });
    },
  },

  {
    method: "GET",
    pattern: /^\/auth\/sessions$/,
    latencyMs: { min: 140, max: 420 },
    handle: (req): Result<SessionSummary[], Failure> => {
      seed();
      const token = requireToken(req);
      if (!token.ok) return err(token.error);

      const mine = liveSession(token.value);
      if (!mine)
        return err(
          unauthenticated("That session has expired.", { status: 401 }),
        );

      /* Never the token. A list endpoint that returns the credential it is
         describing hands every session's key to whoever can read one. */
      return ok(
        [...sessions.values()]
          .filter((s) => s.userId === mine.userId && !isExpired(s))
          .sort((a, b) => b.createdAt - a.createdAt)
          .map(({ id, createdAt, token: t }) => ({
            id,
            createdAt: new Date(createdAt).toISOString(),
            current: t === token.value,
          })),
      );
    },
  },

  {
    method: "DELETE",
    pattern: /^\/auth\/sessions\/([^/]+)$/,
    latencyMs: { min: 200, max: 520 },
    handle: (req, match): Result<null, Failure> => {
      seed();
      const token = requireToken(req);
      if (!token.ok) return err(token.error);

      const mine = liveSession(token.value);
      if (!mine)
        return err(
          unauthenticated("That session has expired.", { status: 401 }),
        );

      const id = decodeURIComponent(match[1]);
      const target = [...sessions.values()].find(
        (s) => s.id === id && s.userId === mine.userId && !isExpired(s),
      );

      /* Already gone is NOT_FOUND, and a caller that removed the row
         optimistically was right — this is the one refusal it should not roll
         back. */
      if (!target)
        return err(
          notFound("That session has already ended.", { status: 404 }),
        );

      /* The session making the request is a CONFLICT, not a permission problem:
         nothing is being refused on authority, the request contradicts the
         state it was made from. Signing yourself out is a different operation
         and doing it silently here would surprise somebody. */
      if (target.token === token.value) {
        return err(
          conflict("That is the session you are using. Sign out instead.", {
            status: 409,
          }),
        );
      }

      sessions.delete(target.token);
      record({
        scope: "session",
        action: "session.revoked",
        subject: target.id,
        actor: byId(mine.userId)?.email ?? "unknown",
        correlationId: req.correlationId,
        detail: { revoked_by: mine.id },
      });
      return ok(null);
    },
  },
];
