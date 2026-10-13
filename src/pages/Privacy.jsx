import React from "react";
import PageShell from "../components/layout/PageShell";

export default function Privacy() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Privacy Policy"
      lead="What we collect, why we collect it, and what we don't do with it."
    >
      <section className="page__section">
        <div className="container">
          <div className="prose">
            <span className="prose__updated">Last updated: 1 October 2026</span>

            <h2>1. Information we collect</h2>
            <ul>
              <li><strong>Account details</strong> — name, email, phone, country.</li>
              <li><strong>Verification data</strong> — if you complete KYC, an ID document and a selfie.</li>
              <li><strong>Payment data</strong> — the method you used, amount, and reference. We never store full card numbers.</li>
              <li><strong>Usage data</strong> — pages viewed, trades placed, device and IP info.</li>
            </ul>

            <h2>2. Why we collect it</h2>
            <ul>
              <li>To run your account and process deposits and withdrawals.</li>
              <li>To comply with anti-money-laundering and tax obligations.</li>
              <li>To detect fraud and keep the platform safe for everyone.</li>
              <li>To improve the product based on how it's actually used.</li>
            </ul>

            <h2>3. What we don't do</h2>
            <ul>
              <li>We don't sell your personal data to third parties.</li>
              <li>We don't share your trades with advertisers.</li>
              <li>We don't store full card details on our servers.</li>
            </ul>

            <h2>4. Who we share with</h2>
            <p>
              We share only what's needed with: payment processors (to move money),
              identity verification providers (if you complete KYC), and law enforcement
              when legally required.
            </p>

            <h2>5. How long we keep it</h2>
            <p>
              Account data is kept while your account is active and for at least 5 years after
              closure, as required by financial regulations.
            </p>

            <h2>6. Your rights</h2>
            <p>
              You can request a copy of your data or ask us to delete it (subject to legal
              retention rules) by emailing <a href="mailto:privacy@tagoption.ke">privacy@tagoption.ke</a>.
            </p>

            <h2>7. Cookies</h2>
            <p>
              We use a small number of essential cookies to keep you signed in and to remember
              your preferences. No third-party tracking cookies.
            </p>

            <h2>8. Changes</h2>
            <p>
              If we change this policy in a meaningful way, we'll notify you in the app before
              the change takes effect.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
