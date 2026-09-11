/** Who somebody is. No password, no token — this is the shape that reaches a
 *  screen, and a screen has no use for either. */
export type User = {
  id: string;
  email: string;
  name: string;
};

/** What a successful sign-in produces.
 *
 *  The token is here because the CALLER has to store it, and where it stores it
 *  is the one framework-specific decision in this flow — a cookie on a server
 *  runtime, something else elsewhere. This tier hands it over and takes no view. */
export type Session = {
  token: string;
  user: User;
};

/** One place this account is signed in.
 *
 *  Carries an `id` and never the token. A list endpoint that returns the
 *  credential it is describing hands every session's key to whoever can read
 *  one of them — asserted in the service's tests, because it is the kind of
 *  thing that gets added back by someone debugging. */
export type SessionSummary = {
  id: string;
  /** ISO 8601. A string on the wire, so nothing depends on a JSON revival step
   *  that does not exist. */
  createdAt: string;
  /** Whether this is the session making the request. */
  current: boolean;
};

export type Credentials = {
  email: string;
  password: string;
};

export type Registration = {
  name: string;
  email: string;
  password: string;
};

/** The minimum, and stated so a product changing it changes one line.
 *  Short on purpose: a template that demands a strong password teaches nobody
 *  anything and makes the demo tedious. */
export const MIN_PASSWORD = 8;
