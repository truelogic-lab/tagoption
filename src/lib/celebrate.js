import { showToast } from "./toast";

export function celebrateWin({ amount }) {
  showToast({
    tone: "win",
    emoji: "🎉",
    title: "Congratulations — you won!",
    subtitle: `+$${amount.toFixed(2)} credited to your balance`,
    ttl: 4500,
  });
}

export function celebrateDeposit({ amount, method }) {
  showToast({
    tone: "deposit",
    emoji: "💸",
    title: "Deposit successful",
    subtitle: `$${amount.toFixed(2)} added via ${method}`,
    ttl: 4200,
  });
}

export function celebrateWithdraw({ amount, method }) {
  showToast({
    tone: "withdraw",
    emoji: "✅",
    title: "Withdrawal requested",
    subtitle: `$${amount.toFixed(2)} to ${method} — processing now`,
    ttl: 4200,
  });
}

export function celebrateLoss({ amount }) {
  // Small, calm, no sad emoji
  showToast({
    tone: "info",
    emoji: "📉",
    title: "Trade lost",
    subtitle: `-$${amount.toFixed(2)}. Next one's yours.`,
    ttl: 3600,
  });
}
