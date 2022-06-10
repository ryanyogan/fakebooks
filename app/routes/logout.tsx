import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { safeRedirect } from "~/utils";
import { logout } from "~/utils/session.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  return logout(request, safeRedirect(formData.get("redirectTo"), "/"));
};

export const loader: LoaderFunction = async () => {
  return redirect("/");
};
