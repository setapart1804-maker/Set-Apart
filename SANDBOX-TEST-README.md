# SET APART-ht PayPal Sandbox (isolated)

These files live in the branch `sandbox-order-testing-20261029`, not the published `main` branch.

This is a **real PayPal Sandbox** checkout test for a fictitious $1.00 purchase. It does not use the production checkout, database, Resend, inventory, or live payments. **Do not deploy it to the public production server.**

## Requirements

- Node 18+ and the repo's installed Express dependency (`npm install` as appropriate).
- PayPal Developer Dashboard: create a **Sandbox** REST app; obtain **Sandbox Client ID** and **Sandbox Secret**.
- Create a Sandbox **Personal** buyer test account in PayPal Developer Dashboard.

## Run locally

Set environment variables `PAYPAL_SANDBOX_CLIENT_ID` and `PAYPAL_SANDBOX_CLIENT_SECRET` (never commit credentials). Then run `node sandbox-server.js` in a separate process. Open `http://localhost:3101/sandbox-checkout.html` and pay using the Sandbox Personal account. The test page will show a PayPal Sandbox order ID and status.

## Not yet verified

No sandbox API transaction has been executed here: credentials and a running separate sandbox service are required. This setup does **not** verify the existing production checkout or Neon database, and it does not add branded `SA000123` numbering.
