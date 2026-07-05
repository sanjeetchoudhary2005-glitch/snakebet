# Snakebet Payment Launch Status

| Method | Status | Create Order | Webhook | Credit | Payout |
| --- | --- | --- | --- | --- | --- |
| Razorpay card | Local code ready, external E2E pending | Yes | Yes, signature checked | Webhook credits completed deposits | Manual admin approval |
| UPI | Manual UPI intent, provider E2E pending | Yes, requires `NEXT_PUBLIC_UPI_ID` | No provider webhook | Pending only until manual/provider reconciliation | Manual admin approval |
| Crypto | Not launch-ready | Disabled unless `CRYPTO_DEPOSIT_ADDRESS` is set | No provider webhook | Pending only, no automatic credit | Hidden from UI |

## External Launch Blockers

- Confirm live/test Razorpay keys and `RAZORPAY_WEBHOOK_SECRET` in the deployment environment.
- Run Razorpay dashboard/ngrok webhook tests for duplicate `payment.captured` and `payment.failed`.
- Choose a real UPI payout/provider workflow or keep withdrawals as manual admin processing.
- Do not advertise crypto until a real provider, exchange-rate source, webhook signature check, and reconciliation flow are implemented.
