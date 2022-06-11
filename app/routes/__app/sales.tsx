import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { NavLink, Outlet, useLoaderData, useMatches } from "@remix-run/react";
import { getFirstCustomer } from "~/models/customer.server";
import { getFirstInvoice } from "~/models/invoice.server";
import { requireUser } from "~/utils/session.server";

type LoaderData = {
  firstInvoiceId?: string;
  firstCustomerId?: string;
};

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? "font-bold text-black" : "";

export const loader: LoaderFunction = async ({ request }) => {
  await requireUser(request);
  const [firstInvoice, firstCustomer] = await Promise.all([
    getFirstInvoice(),
    getFirstCustomer(),
  ]);

  return json<LoaderData>({
    firstInvoiceId: firstInvoice?.id,
    firstCustomerId: firstCustomer?.id,
  });
};

export default function SalesRoute() {
  const data = useLoaderData() as LoaderData;
  const matches = useMatches();
  const indexMatches = matches.some((m) => m.id === "routes/__app/sales/index");
  const invoiceMatches = matches.some(
    (m) => m.id === "routes/__app/sales/invoices"
  );
  const customerMatches = matches.some(
    (m) => m.id === "routes/__app/sales/customers"
  );
  const depositsMatches = matches.some(
    (m) => m.id === "routes/__app/sales/deposits"
  );

  return (
    <div className="relative h-full pt-10">
      <h1 className="font-display text-d-h3 text-black">Sales</h1>
      <div className="h-6" />
      <div className="flex gap-4 border-b border-gray-100 pb-4 text-[length:14px] font-medium text-gray-400">
        <NavLink to="." className={linkClassName({ isActive: indexMatches })}>
          Overview
        </NavLink>
        <NavLink to="." className={linkClassName({ isActive: false })}>
          Subscriptions
        </NavLink>
        <NavLink
          prefetch="intent"
          to={
            data.firstInvoiceId ? `invoices/${data.firstInvoiceId}` : "invoices"
          }
          className={linkClassName({ isActive: invoiceMatches })}
        >
          Invoices
        </NavLink>
        <NavLink
          prefetch="intent"
          to={
            data.firstCustomerId
              ? `customers/${data.firstCustomerId}`
              : "customers"
          }
          className={linkClassName({ isActive: customerMatches })}
        >
          Customers
        </NavLink>
        <NavLink
          prefetch="intent"
          to="deposits"
          className={linkClassName({ isActive: depositsMatches })}
        >
          Deposits
        </NavLink>
      </div>
      <div className="h-4" />
      <Outlet />
    </div>
  );
}
