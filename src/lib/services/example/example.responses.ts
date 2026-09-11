import {
  responseArray,
  responseDecoder,
  responseObject,
  responseText,
} from "../../http";
import type { Item } from "./example.types";

function readItem(value: unknown): Item | undefined {
  const item = responseObject(value);
  if (
    !item ||
    !responseText(item.id) ||
    !responseText(item.name) ||
    !responseText(item.host)
  )
    return undefined;
  return { id: item.id, name: item.name, host: item.host };
}

export const decodeItem = responseDecoder("item", readItem);
export const decodeItems = responseDecoder(
  "item list",
  responseArray(readItem),
);
export const decodeOptionalItem = responseDecoder("optional item", (value) =>
  value === null ? null : readItem(value),
);
