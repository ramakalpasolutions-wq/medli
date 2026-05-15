import PolicyLayout, { Section } from '@/components/PolicyLayout'

export const metadata = {
  title:       'Payment, Cancellation & Refund Policy | Statbook',
  description: 'Payment, Cancellation & Refund Policy of Statbook Healthcare Platform — operated by Sectirmeld.',
}

export default function RefundPolicyPage() {
  return (
    <PolicyLayout
      title="Payment, Cancellation & Refund Policy"
      icon="↩️"
      lastUpdated="May 15, 2026"
      effectiveDate="May 15, 2026"
    >
      <Section>
        <p style={{ fontSize: 14, color: '#64748b', fontStyle: 'italic', marginBottom: 24 }}>
          Statbook Healthcare Platform — Operated by Sectirmeld
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="1. Introduction">
        <p>
          This Payment, Cancellation & Refund Policy (<strong>"Policy"</strong>)
          forms an integral part of the Terms of Service and governs all
          payments, cancellations, refunds, and related financial transactions
          undertaken on the Statbook platform, including its website, mobile
          application, and associated services (collectively, the{' '}
          <strong>"Platform"</strong>), operated by{' '}
          <strong>Sectirmeld</strong> (<strong>"Company"</strong>,{' '}
          <strong>"we"</strong>, <strong>"us"</strong>, or{' '}
          <strong>"our"</strong>).
        </p>
        <p>
          By initiating or completing any transaction on the Platform, you (
          <strong>"User"</strong>, <strong>"you"</strong>, or{' '}
          <strong>"your"</strong>) expressly agree to be bound by this Policy.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="2. Scope of Services">
        <p>
          <strong>2.1</strong> The Platform is a technology-based intermediary
          that facilitates bookings and payments in relation to:
        </p>
        <ul>
          <li>Doctor consultations (online and offline);</li>
          <li>Hospital services;</li>
          <li>Diagnostic and laboratory services;</li>
          <li>Doctor-at-home services;</li>
          <li>Healthcare escort services (as and when made available).</li>
        </ul>
        <p>
          <strong>2.2</strong> The Company does not provide medical or
          healthcare services and acts solely as an intermediary facilitating
          transactions between Users and independent third-party service
          providers (<strong>"Service Providers"</strong>).
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="3. Payment Terms">
        <h3>3.1 Upfront Payment Requirement</h3>
        <p>
          All services available on the Platform are offered on a{' '}
          <strong>prepaid basis</strong> unless expressly stated otherwise.
          Users are required to make full payment at the time of booking.
        </p>

        <h3>3.2 Fee Components</h3>
        <p>
          The total amount payable by the User may comprise, without
          limitation:
        </p>
        <ul>
          <li>Consultation fee or service fee charged by the Service Provider;</li>
          <li>Platform convenience fee or service fee charged by the Company;</li>
          <li>Applicable taxes, levies, and statutory charges.</li>
        </ul>

        <h3>3.3 Pricing Transparency</h3>
        <p>
          The Platform endeavours to display a clear and itemized breakdown
          of charges prior to payment. By proceeding with payment, the User
          confirms acceptance of such charges.
        </p>

        <h3>3.4 No Price Guarantee</h3>
        <p>
          Prices for services may vary based on factors including, but not
          limited to, location, service type, time of booking, and Service
          Provider discretion. The Company does not guarantee uniform pricing
          across the Platform.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="4. Payment Processing">
        <h3>4.1 Third-Party Payment Gateways</h3>
        <p>
          All payments are processed through authorized third-party payment
          service providers. The Company does not store or process payment
          card details directly.
        </p>

        <h3>4.2 Authorization and Confirmation</h3>
        <p>
          Upon successful payment authorization, a booking confirmation shall
          be generated. In the event of payment failure, the booking shall
          not be confirmed.
        </p>

        <h3>4.3 Intermediary Role</h3>
        <p>
          The Company acts solely as a facilitator of payments and may
          temporarily hold funds for the limited purpose of settlement with
          the relevant Service Provider.
        </p>

        <h3>4.4 Payment Failures</h3>
        <p>
          The Company shall not be liable for any delay, failure, or error in
          payment processing arising from:
        </p>
        <ul>
          <li>Banking system failures;</li>
          <li>Payment gateway disruptions;</li>
          <li>Network or technical issues beyond the Company's control.</li>
        </ul>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="5. Cancellation Policy">
        <h3>5.1 User-Initiated Cancellation</h3>
        <p>Users may cancel a booking subject to the following conditions:</p>
        <ul>
          <li>
            Cancellations made within the <strong>permitted time window</strong>{' '}
            (as specified on the Platform at the time of booking) may be
            eligible for a full or partial refund;
          </li>
          <li>
            Cancellations made after such permitted window, or after the
            scheduled service time, <strong>may not be eligible for any refund</strong>.
          </li>
        </ul>

        <h3>5.2 Service Provider Cancellation</h3>
        <p>In the event a Service Provider cancels a confirmed booking:</p>
        <ul>
          <li>The User shall be entitled to a <strong>full refund</strong> of the amount paid; or</li>
          <li>The User may opt to reschedule, subject to availability.</li>
        </ul>

        <h3>5.3 Platform-Initiated Cancellation</h3>
        <p>
          The Company reserves the right to cancel any booking due to
          technical errors, suspected fraudulent activity, or operational
          constraints. In such cases, a <strong>full refund</strong> shall
          be processed.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="6. No-Show Policy">
        <p>
          <strong>6.1</strong> In the event a User fails to attend a
          scheduled appointment (online or offline) without prior
          cancellation:
        </p>
        <ul>
          <li>The booking shall be treated as a <strong>"no-show"</strong>; and</li>
          <li><strong>No refund shall be payable.</strong></li>
        </ul>
        <p>
          <strong>6.2</strong> The determination of a no-show shall be made
          based on system records and/or confirmation from the Service
          Provider.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="7. Refund Policy">
        <h3>7.1 Eligibility</h3>
        <p>Refunds shall be processed only in the following circumstances:</p>
        <ul>
          <li>Eligible cancellations in accordance with Clause 5;</li>
          <li>Service Provider cancellations;</li>
          <li>Failed or unsuccessful transactions;</li>
          <li>Duplicate payments;</li>
          <li>Exceptional circumstances, at the sole discretion of the Company.</li>
        </ul>

        <h3>7.2 Refund Method</h3>
        <p>
          All refunds shall, wherever possible, be processed to the{' '}
          <strong>original payment method</strong> used at the time of
          transaction.
        </p>

        <h3>7.3 Processing Timelines</h3>
        <p>
          Refunds shall typically be processed within{' '}
          <strong>5–10 business days</strong>, subject to:
        </p>
        <ul>
          <li>Verification of the request;</li>
          <li>Processing timelines of banks and payment gateways.</li>
        </ul>
        <p>
          The Company shall not be responsible for delays caused by financial
          institutions.
        </p>

        <h3>7.4 Deductions</h3>
        <p>
          The Company reserves the right to deduct applicable charges,
          including but not limited to:
        </p>
        <ul>
          <li>Payment gateway charges;</li>
          <li>Platform fees (where non-refundable);</li>
          <li>Cancellation charges as disclosed at the time of booking.</li>
        </ul>

        <blockquote>
          <strong>Quick Reference — Refund Timeline:</strong>
          <table>
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Refund Amount</th>
                <th>Processing Time</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cancelled within permitted window</td>
                <td>Full / Partial</td>
                <td>5–10 business days</td>
              </tr>
              <tr>
                <td>Service Provider cancelled</td>
                <td>Full Refund</td>
                <td>5–10 business days</td>
              </tr>
              <tr>
                <td>Platform-initiated cancellation</td>
                <td>Full Refund</td>
                <td>5–10 business days</td>
              </tr>
              <tr>
                <td>Failed transaction (debited)</td>
                <td>Full Reversal</td>
                <td>As per payment provider</td>
              </tr>
              <tr>
                <td>Duplicate payment</td>
                <td>Full Refund</td>
                <td>After verification</td>
              </tr>
              <tr>
                <td>Late cancellation / No-show</td>
                <td>No Refund</td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
        </blockquote>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="8. Failed and Disputed Transactions">
        <h3>8.1 Failed Transactions</h3>
        <p>
          In the event of a failed transaction where funds are debited but
          no booking is confirmed:
        </p>
        <p>
          The amount shall be automatically reversed within the timelines
          prescribed by the payment provider.
        </p>

        <h3>8.2 Duplicate Payments</h3>
        <p>
          Users are advised to verify payment status before retrying.
          Duplicate payments, if identified, shall be refunded after due
          verification.
        </p>

        <h3>8.3 Chargebacks</h3>
        <p>
          Users agree <strong>not to initiate chargebacks</strong> without
          first contacting the Platform's support team. The Company reserves
          the right to suspend accounts in cases of fraudulent or abusive
          chargeback requests.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="9. Taxes">
        <p>
          All applicable taxes, including <strong>Goods and Services Tax (GST)</strong>,
          shall be charged in accordance with prevailing laws and shall be
          clearly indicated at the time of payment.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="10. Modification of Policy">
        <p>
          The Company reserves the right to amend, modify, or update this
          Policy at any time. Such changes shall be effective upon
          publication on the Platform. Continued use of the Platform
          following such updates constitutes acceptance of the revised
          Policy.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="11. Limitation of Liability">
        <p>
          To the fullest extent permitted under applicable law, the Company
          shall not be liable for:
        </p>
        <ul>
          <li>Any indirect, incidental, or consequential damages arising from payment transactions;</li>
          <li>Errors attributable to third-party payment processors;</li>
          <li>Delays in refunds caused by banking or financial systems;</li>
          <li>Disputes between Users and Service Providers regarding service quality or delivery.</li>
        </ul>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="12. Contact">
        <p>
          For any payment-related queries or grievances, Users may contact:
        </p>
        <table>
          <tbody>
            <tr>
              <td><strong>Name</strong></td>
              <td>[To be inserted]</td>
            </tr>
            <tr>
              <td><strong>Email</strong></td>
              <td><a href="mailto:grievanceofficer@statbook.com">grievanceofficer@statbook.com</a></td>
            </tr>
            <tr>
              <td><strong>Address</strong></td>
              <td>Petlurivaripalem village, Narasaraopet Mandal, Palnadu District, Andhra Pradesh – 522603, India</td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section>
        <div style={{
          marginTop: 24,
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 12,
          textAlign: 'center',
        }}>
          <p style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: '#4f46e5',
            lineHeight: 1.6,
          }}>
            By proceeding with any payment on the Platform, you acknowledge
            that you have read, understood, and agreed to this Policy in its
            entirety.
          </p>
        </div>
      </Section>
    </PolicyLayout>
  )
}