import type { Deposit, LineItem } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  useFetcher,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import invariant from "tiny-invariant";
import { inputClasses, LabelText, submitButtonClasses } from "~/components";
import type { DueStatus } from "~/models/invoice.server";
import { getInvoiceDerivedData } from "~/models/invoice.server";
import { getInvoiceDetails } from "~/models/invoice.server";
import { createUser } from "~/models/user.server";
import { currencyFormatter, parseDate } from "~/utils";
import { requireUser } from "~/utils/session.server";

type LoaderData = {
  customerName: string;
  customerId: string;
  totalAmount: number;
  dueStatus: DueStatus;
  dueDisplay: string;
  invoiceDateDisplay: string;
  lineItems: Array<
    Pick<LineItem, "id" | "quantity" | "unitPrice" | "description">
  >;
  deposits: Array<
    Pick<Deposit, "id" | "amount"> & { depositDateFormatted: string }
  >;
};

type ActionData = {
  errors: {
    amount: string | null;
    depositDate: string | null;
  };
};

export const action: ActionFunction = async ({ request, params }) => {
  // await createUser("ruya", "ads");
  return json({});
};

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireUser(request);
  const { invoiceId } = params;
  if (typeof invoiceId !== "string") {
    throw new Error("This should be unpossible");
  }
  const invoiceDetails = await getInvoiceDetails(invoiceId);
  if (!invoiceDetails) {
    throw new Response("not found", { status: 404 });
  }

  return json<LoaderData>({
    customerName: invoiceDetails.invoice.customer.name,
    customerId: invoiceDetails.invoice.customer.id,
    totalAmount: invoiceDetails.totalAmount,
    dueStatus: invoiceDetails.dueStatus,
    dueDisplay: invoiceDetails.dueStatusDisplay,
    invoiceDateDisplay: invoiceDetails.invoice.invoiceDate.toLocaleDateString(),
    lineItems: invoiceDetails.invoice.lineItems.map((li) => ({
      id: li.id,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
    })),
    deposits: invoiceDetails.invoice.deposits.map((deposit) => ({
      id: deposit.id,
      amount: deposit.amount,
      depositDateFormatted: deposit.depositDate.toLocaleDateString(),
    })),
  });
};

const lineItemClassName =
  "flex justify-between border-t border-gray-100 py-4 text-[14px] leading-[24px]";

export default function InvoiceRoute() {
  const data = useLoaderData() as LoaderData;
  const location = useLocation();

  return (
    <div className="relative p-10" key={location.key}>
      <Link
        to={`../../customers/${data.customerId}`}
        className="text=[length:32px] font-bold leading-[40px]"
      >
        {data.customerName}
      </Link>
      <div className="text=[length:32px] leading=[40px] font-bold">
        {currencyFormatter.format(data.totalAmount)}
      </div>
      <LabelText>
        <span
          className={
            data.dueStatus === "paid"
              ? "text-green-brand"
              : data.dueStatus === "overdue"
              ? "text-red-brand"
              : ""
          }
        >
          {data.dueDisplay}
        </span>
        {` • Invoiced ${data.invoiceDateDisplay}`}
      </LabelText>
      <div className="h-4" />
      {data.lineItems.map((item) => (
        <LineItemDisplay
          key={item.id}
          description={item.description}
          unitPrice={item.unitPrice}
          quantity={item.quantity}
        />
      ))}
      <div className={`${lineItemClassName} font-bold`}>
        <div>Net Total</div>
      </div>
      <div className="h-4" />
      <Deposits />
    </div>
  );
}

function LineItemDisplay({
  description,
  quantity,
  unitPrice,
}: {
  description: string;
  quantity: number;
  unitPrice: number;
}) {
  return (
    <div className={lineItemClassName}>
      <div>{description}</div>
      {quantity === 1 ? null : <div className="text-[10px]">({quantity}x)</div>}
      <div>{currencyFormatter.format(unitPrice)}</div>
    </div>
  );
}

interface DepositFormControlsCollection extends HTMLFormControlsCollection {
  amount?: HTMLInputElement;
  depositData?: HTMLInputElement;
  note?: HTMLInputElement;
  intent?: HTMLInputElement;
}

interface DepositFormElement extends HTMLFormElement {
  readonly elements: DepositFormControlsCollection;
}

function Deposits() {
  const data = useLoaderData() as LoaderData;
  const newDepositFetcher = useFetcher();
  const formRef = useRef<HTMLFormElement>(null);

  const deposits = [...data.deposits];

  if (newDepositFetcher.submission) {
    const amount = Number(newDepositFetcher.submission.formData.get("amount"));
    const depositDateVal =
      newDepositFetcher.submission.formData.get("depositDate");
    const depositDate =
      typeof depositDateVal === "string" ? parseDate(depositDateVal) : null;

    invariant(depositDate, "required");

    deposits.push({
      id: "new",
      amount,
      depositDateFormatted: depositDate.toLocaleDateString(),
    });
  }

  const errors = newDepositFetcher.data?.errors as
    | ActionData["errors"]
    | undefined;

  return (
    <div>
      <div className="font-bold leading-8">Deposits</div>
      {deposits.length > 0 ? (
        deposits.map((deposit) => (
          <div key={deposit.id} className={lineItemClassName}>
            <Link
              to={`../../deposits/${deposit.id}`}
              className="text-blue-600 underline"
            >
              {deposit.depositDateFormatted}
            </Link>
            <div>{currencyFormatter.format(deposit.amount)}</div>
          </div>
        ))
      ) : (
        <div>None yet</div>
      )}
      <newDepositFetcher.Form
        method="post"
        className="grid grid-cols-1 gap-x-4 gap-y-2 lg:grid-cols-2"
        ref={formRef}
        noValidate
      >
        <div className="min-w-[100px]">
          <div className="flex flex-wrap items-center gap-1">
            <LabelText>
              <label htmlFor="depositAmount">Amount</label>
            </LabelText>
            {errors?.amount ? (
              <em id="amount-error" className="text-d-p-xs text-red-600">
                {errors.amount}
              </em>
            ) : null}
          </div>
          <input
            id="depositAmount"
            name="amount"
            type="number"
            className={inputClasses}
            min="0.01"
            step="any"
            required
            aria-invalid={Boolean(errors?.amount) || undefined}
            aria-errormessage={errors?.amount ? "amount-error" : undefined}
          />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-1">
            <LabelText>
              <label htmlFor="depositDate">Date</label>
            </LabelText>
            {errors?.depositDate ? (
              <em id="depositDate-error" className="text-d-p-xs text-red-600">
                {errors.depositDate}
              </em>
            ) : null}
          </div>
          <input
            id="depositDate"
            name="depositDate"
            type="date"
            className={`${inputClasses} h-[34px]`}
            required
            aria-invalid={Boolean(errors?.depositDate) || undefined}
            aria-errormessage={
              errors?.depositDate ? "depositDate-error" : undefined
            }
          />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:col-span-2 lg:flex">
          <div className="flex-1">
            <LabelText>
              <label htmlFor="depositNote">Note</label>
            </LabelText>
            <input
              id="depositNote"
              name="note"
              type="text"
              className={inputClasses}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className={submitButtonClasses}
              name="intent"
              value="create-deposit"
            >
              Create
            </button>
          </div>
        </div>
      </newDepositFetcher.Form>
    </div>
  );
}
