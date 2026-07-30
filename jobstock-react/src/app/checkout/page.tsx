import { redirect } from "next/navigation";

// The standalone checkout mockup page from the original template had no real
// data behind it. The actual, working checkout flow (real packages, real
// order/confirm API calls) lives in the employer dashboard's Package page.
export default function CheckoutPage() {
  redirect("/employer-package");
}
