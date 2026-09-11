import {
  responseDecoder,
  responseObject,
  responseText,
  type HttpClient,
  type CallOptions,
} from "../../http";
import { err, internal, type Result } from "../../kernel";

export type Capability = { allowed: true } | { allowed: false; reason: string };
export type Capabilities = {
  subject: string;
  resource: string;
  revision: number;
  grants: Record<string, Capability>;
};
export const decodeCapabilities = responseDecoder(
  "capabilities",
  (raw): Capabilities | undefined => {
    const value = responseObject(raw),
      grants = responseObject(value?.grants);
    if (
      !value ||
      !responseText(value.subject) ||
      !responseText(value.resource) ||
      !Number.isSafeInteger(value.revision) ||
      (value.revision as number) < 1 ||
      !grants
    )
      return;
    const entries: Array<[string, Capability]> = [];
    for (const [name, raw] of Object.entries(grants)) {
      const decision = responseObject(raw);
      if (decision?.allowed === true) entries.push([name, { allowed: true }]);
      else if (decision?.allowed === false && responseText(decision.reason))
        entries.push([name, { allowed: false, reason: decision.reason }]);
      else return;
    }
    return {
      subject: value.subject,
      resource: value.resource,
      revision: value.revision as number,
      grants: Object.fromEntries(entries),
    };
  },
);
export function capability(snapshot: Capabilities, name: string): Capability {
  return Object.hasOwn(snapshot.grants, name)
    ? snapshot.grants[name]
    : {
        allowed: false,
        reason: "This action is not available for this account.",
      };
}
export async function readCapabilities(
  client: HttpClient,
  subject: string,
  resource: string,
  options?: CallOptions,
): Promise<Result<Capabilities>> {
  const result = (
    await client.get<unknown>(
      `/capabilities/${encodeURIComponent(resource)}`,
      options,
    )
  ).andThen((value) => decodeCapabilities(value, options?.trace));
  if (
    result.ok &&
    (result.value.subject !== subject || result.value.resource !== resource)
  )
    return err(
      internal("Capabilities belong to another scope.", {
        type: "invalid_response",
      }),
    );
  return result;
}
