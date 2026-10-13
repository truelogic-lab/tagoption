import React from "react";
import PageShell from "../components/layout/PageShell";

export default function Terms() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Terms of Service"
      lead="The rules of using TagOption. Plain language, as much as the law allows."
    >
      <section className="page__section">
        <div className="container">
          <div className="prose">
            <span className="prose__updated">Last updated: 1 October 2026</span>

            <h2>1. Who we are</h2>
            <p>
              TagOption ("we", "us", "our") operates the website at <strong>tagoption.ke</strong> and the
              trading platform accessible through it. By creating an account, you agree to these terms.
            </p>

            <h2>2. Eligibility</h2>
            <p>
              You must be at least 18 years old and legally allowed to enter into contracts in your
              country of residence. You are responsible for ensuring that trading synthetic markets
              is legal where you live.
            </p>

            <h2>3. Your account</h2>
            <ul>
              <li>You must provide accurate information when signing up.</li>
              <li>You are responsible for keeping your password and any two-factor device secure.</li>
              <li>One account per person. Multiple accounts may be closed.</li>
              <li>We may suspend or close accounts involved in fraud, abuse, or manipulation.</li>
            </ul>

            <h2>4. Deposits and withdrawals</h2>
            <p>
              Deposits are credited once confirmed by the payment provider. Withdrawals are processed
              back to the same method used to deposit. Timings depend on the method — M-Pesa and USDT
              typically within minutes, cards within 1–3 business days.
            </p>

            <h2>5. Trading risk</h2>
            <p>
              <strong>Trading involves risk.</strong> You can lose the money you put on a trade. Past
              performance does not guarantee future results. Never trade more than you can afford
              to lose.
            </p>

            <h2>6. Fees</h2>
            <p>
              Our fees are shown at the point of trade. We do not charge hidden commissions.
              Third-party payment providers may charge their own fees, which we do not control.
            </p>

            <h2>7. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the platform for money laundering or any illegal activity.</li>
              <li>Attempt to hack, scrape, or disrupt the service.</li>
              <li>Use automated systems in a way that harms other users.</li>
            </ul>

            <h2>8. Limitation of liability</h2>
            <p>
              We provide the platform "as is". We are not liable for market losses, missed trades,
              or interruptions outside our reasonable control.
            </p>

            <h2>9. Changes to these terms</h2>
            <p>
              We may update these terms from time to time. Material changes will be announced
              on the platform. Continued use after an update means you accept the new terms.
            </p>

            <h2>10. Contact</h2>
            <p>
              Questions about these terms? Email <a href="mailto:legal@tagoption.ke">legal@tagoption.ke</a>.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
