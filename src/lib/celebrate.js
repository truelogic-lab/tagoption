import { showToast } from "./toast";

/**
 * Professional, restrained toasts.
 * No emoji, no "congrats", just confirm what happened with the exact numbers.
 */

export function celebrateWin({ amount }) {
  showToast({
    tone: "win",
    label: "Trade settled",
    title: `You won $${amount.toFixed(2)}`,
    subtitle: "Credited to your balance",
    ttl: 4200,
  });
}

export function celebrateLoss({ amount }) {
  showToast({
    tone: "loss",
    label: "Trade settled",
    title: `Lost $${amount.toFixed(2)}`,
    subtitle: "Better luck on the next one",
    ttl: 3600,
  });
}

export function celebrateDeposit({ amount, method }) {
  showToast({
    tone: "deposit",
    label: "Deposit",
    title: `$${amount.toFixed(2)} added`,
    subtitle: `via ${method}`,
    ttl: 4200,
  });
}

export function celebrateWithdraw({ amount, method }) {
  showToast({
    tone: "withdraw",
    label: "Withdrawal",
    title: `$${amount.toFixed(2)} requested`,
    subtitle: `to ${method} · processing`,
    ttl: 4200,
  });
}
