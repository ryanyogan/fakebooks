import type { LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { getFirstInvoice } from "~/models/invoice.server";
import { requireUser } from "~/utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  await requireUser(request);
  const firstInvoice = await getFirstInvoice();
  if (!firstInvoice) {
    return json({});
  }

  // return redirect(`/sales/invoices${firstInvoice.id}`);
  return json({});
};

export default function InvoiceIndex() {
  return (
    <div className="p-10 text-slate-700">You don't have any invoices 😭</div>
  );
}
