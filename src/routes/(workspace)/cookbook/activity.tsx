import Page from "~/examples/(workspace)/cookbook/(recipes)/activity/page";
import { Guard } from "~/lib/app/guard";
export default function Route() {
  return <Guard>{(user) => <Page user={user} />}</Guard>;
}
