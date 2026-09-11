import {
  responseDecoder,
  responseText,
  type HttpClient,
  type CallOptions,
} from "../../http";

const decode = responseDecoder("protected workspace message", (value) =>
  responseText(value) ? value : undefined,
);
export async function readProtectedWorkspace(
  client: HttpClient,
  options?: CallOptions,
) {
  return (await client.get<unknown>("/protected-workspace", options)).andThen(
    (value) => decode(value, options?.trace),
  );
}
export async function updateProtectedWorkspace(
  client: HttpClient,
  options?: CallOptions,
) {
  return (await client.post<unknown>("/protected-workspace", options)).andThen(
    (value) => decode(value, options?.trace),
  );
}
