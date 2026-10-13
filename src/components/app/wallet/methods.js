/**
 * Payment methods and the fields each one requires.
 * Field spec: { name, label, placeholder, type, inputMode, pattern?, validate? }
 */

export const METHODS = [
  {
    id: "mpesa",
    label: "M-Pesa",
    desc: "Instant mobile money",
    detail: "Deposits land in seconds. Withdrawals land in under a minute.",
    tone: "blue",
    icon: "phone",
    fields: [
      {
        name: "phone",
        label: "M-Pesa phone number",
        placeholder: "+254 7XX XXX XXX",
        type: "tel",
        inputMode: "tel",
        autoComplete: "tel",
        validate: (v) => /^\+?[0-9\s-]{9,}$/.test(String(v).trim()),
        error: "Enter a valid phone number",
      },
    ],
  },
  {
    id: "usdt",
    label: "USDT (TRC20)",
    desc: "Cryptocurrency · auto-credited",
    detail: "Send from any TRC20 wallet. Credited once confirmed on-chain.",
    tone: "green",
    icon: "usdt",
    fields: [
      {
        name: "wallet",
        label: "TRC20 wallet address",
        placeholder: "T...",
        type: "text",
        inputMode: "text",
        autoComplete: "off",
        validate: (v) => /^T[1-9A-HJ-NP-Za-km-z]{20,}$/.test(String(v).trim()),
        error: "Enter a valid TRC20 address (starts with T)",
      },
    ],
  },
  {
    id: "card",
    label: "Card",
    desc: "Visa, Mastercard",
    detail: "Deposits instant. Withdrawals 1–3 business days.",
    tone: "blue",
    icon: "card",
    fields: [
      {
        name: "cardNumber",
        label: "Card number",
        placeholder: "1234 5678 9012 3456",
        type: "text",
        inputMode: "numeric",
        autoComplete: "cc-number",
        maxLength: 19,
        validate: (v) => /^[\d\s]{12,19}$/.test(String(v).trim()),
        error: "Enter a valid card number",
      },
      {
        name: "cardExpiry",
        label: "Expiry (MM/YY)",
        placeholder: "12/28",
        type: "text",
        inputMode: "numeric",
        autoComplete: "cc-exp",
        maxLength: 5,
        validate: (v) => /^\d{2}\/\d{2}$/.test(String(v).trim()),
        error: "Use MM/YY",
      },
      {
        name: "cardCvc",
        label: "CVC",
        placeholder: "123",
        type: "password",
        inputMode: "numeric",
        autoComplete: "cc-csc",
        maxLength: 4,
        validate: (v) => /^\d{3,4}$/.test(String(v).trim()),
        error: "3 or 4 digits",
      },
      {
        name: "cardHolder",
        label: "Cardholder name",
        placeholder: "Name as printed on card",
        type: "text",
        inputMode: "text",
        autoComplete: "cc-name",
        validate: (v) => String(v).trim().length >= 2,
        error: "Enter the name on the card",
      },
    ],
  },
];

export function getMethod(id) {
  return METHODS.find((m) => m.id === id);
}
