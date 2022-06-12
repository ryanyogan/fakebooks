import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Response } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { inputClasses, LabelText, submitButtonClasses } from "~/components";
import { createCustomer } from "~/models/customer.server";
import { requireUser } from "~/utils/session.server";

type ActionData = {
  errors: {
    email: string | null;
    name: string | null;
  };
};

function validateName(name: string) {
  return name === "" ? "Please enter a valid name" : null;
}

export const action: ActionFunction = async ({ request }) => {
  await requireUser(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "create": {
      const name = formData.get("name");
      const email = formData.get("email");
      invariant(typeof name === "string", "name is required");
      invariant(typeof email === "string", "email is required");

      const errors: ActionData["errors"] = {
        name: validateName(name),
        email: validateName(email),
      };

      const nameHasErrors = errors.name !== null;
      const emailHasErrors = errors.email !== null;
      const hasErrors = nameHasErrors || emailHasErrors;

      if (hasErrors) {
        return json<ActionData>({ errors });
      }

      const customer = await createCustomer({ name, email });

      return redirect(`/sales/customers/${customer.id}`);
    }
  }

  return new Response(`Unsupported intent: ${intent}`, { status: 400 });
};

export default function NewCustomer() {
  const actionData = useActionData() as ActionData;

  return (
    <div className="relative p-10">
      <h2 className="mb-4 font-display">New Customer</h2>
      <Form method="post" className="flex flex-col gap-4">
        <div>
          <label htmlFor="name">
            <LabelText>Name</LabelText>
          </label>
          {actionData?.errors.name ? (
            <em id="name-error" className="text-d-p-xs text-red-600">
              {actionData.errors.name}
            </em>
          ) : null}
          <input id="name" name="name" className={inputClasses} type="text" />
        </div>
        <div>
          <label htmlFor="email">
            <LabelText>Email</LabelText>
          </label>
          {actionData?.errors.email ? (
            <em id="email-error" className="text-d-p-xs text-red-600">
              {actionData.errors.email}
            </em>
          ) : null}
          <input
            id="email"
            name="email"
            className={inputClasses}
            type="email"
          />
        </div>

        <div>
          <button
            type="submit"
            name="intent"
            value="create"
            className={submitButtonClasses}
          >
            Create Customer
          </button>
        </div>
      </Form>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return (
    <div className="absolute inset-0 flex justify-center bg-red-100 pt-4">
      <div className="text-center text-red-brand">
        <div className="text-[14px] font-bold">On snap!</div>
        <div className="px-2 text-[12px]">There was a problem. Sorry.</div>
      </div>
    </div>
  );
}
