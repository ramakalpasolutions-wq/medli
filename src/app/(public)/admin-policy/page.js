import PolicyLayout, { Section } from '@/components/PolicyLayout'

export const metadata = {
  title:       'Admin Dashboard Usage Policy | Medli',
  description: 'Admin Dashboard Usage Policy for Healthcare Partners on the Medli Platform — operated by Sectirmeld.',
}

export default function AdminPolicyPage() {
  return (
    <PolicyLayout
      title="Admin Dashboard Usage Policy"
      icon="🛡️"
      lastUpdated="May 15, 2026"
      effectiveDate="May 15, 2026"
    >
      <Section>
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 12,
          marginBottom: 24,
        }}>
          <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.7 }}>
            <strong style={{ color: '#4f46e5' }}>📌 Important:</strong> This Policy
            applies exclusively to <strong>Healthcare Partners</strong> (Hospitals,
            Labs, Doctors, and authorized administrators) accessing the Medli
            Admin Dashboard. End users / patients should refer to our{' '}
            <a href="/terms" style={{ color: '#6366f1', fontWeight: 600 }}>
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" style={{ color: '#6366f1', fontWeight: 600 }}>
              Privacy Policy
            </a>.
          </p>
        </div>

        <p>
          This <strong>Admin Dashboard Usage Policy</strong> (
          <strong>"Policy"</strong>) governs access to and use of the
          administrative interface (<strong>"Admin Dashboard"</strong>) made
          available on the Medli platform operated by{' '}
          <strong>Sectirmeld</strong> (<strong>"Company"</strong>).
        </p>
        <p>
          This Policy is supplemental to, and shall be read in conjunction
          with, the <strong>Healthcare Partner Agreement</strong> entered into
          between the Company and the Partner (<strong>"Partner Agreement"</strong>).
          In the event of any inconsistency, the Partner Agreement shall
          prevail.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="1. Access and Authorization">
        <p>
          Access to the Admin Dashboard is restricted to{' '}
          <strong>authorized representatives</strong> of the Partner who have
          been duly approved and registered on the Platform.
        </p>
        <p>The Partner shall:</p>
        <ul>
          <li>Ensure that access credentials are issued only to authorized personnel;</li>
          <li>Be solely responsible for all activities conducted through its Admin Dashboard account(s);</li>
          <li>Immediately notify the Company in case of any unauthorized access or suspected security breach.</li>
        </ul>
        <p>
          The Company reserves the right to suspend or restrict access where
          misuse or unauthorized activity is suspected.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="2. Permitted Use">
        <p>
          The Admin Dashboard may be used solely for legitimate operational
          purposes, including:
        </p>
        <ul>
          <li>Managing hospital profile and service listings;</li>
          <li>Adding, updating, or managing doctor profiles and schedules;</li>
          <li>Accepting, rejecting, or managing appointment requests;</li>
          <li>Viewing consultation data and operational analytics;</li>
          <li>Managing diagnostic and laboratory service requests.</li>
        </ul>
        <p>
          Use of the Admin Dashboard for any purpose outside the scope of the
          Platform's intended functionality is <strong>strictly prohibited</strong>.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="3. Data Handling and Confidentiality">
        <p>
          The Partner acknowledges that access to the Admin Dashboard may
          involve access to <strong>sensitive personal data</strong>, including
          patient information.
        </p>
        <p>Accordingly, the Partner shall:</p>
        <ul>
          <li>Use such data strictly for the purpose of delivering healthcare services;</li>
          <li>Maintain strict confidentiality of all User data;</li>
          <li>Implement appropriate technical and organizational safeguards to prevent unauthorized access, disclosure, or misuse;</li>
          <li>Comply with applicable data protection laws, including the <strong>Digital Personal Data Protection Act, 2023</strong>.</li>
        </ul>
        <p>
          The Partner shall <strong>not copy, store, transfer, or use User data</strong>{' '}
          for any purpose other than as permitted under the Partner Agreement.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="4. Accuracy of Information">
        <p>
          The Partner shall ensure that all information entered or updated
          through the Admin Dashboard, including but not limited to:
        </p>
        <ul>
          <li>Hospital details;</li>
          <li>Doctor profiles and qualifications;</li>
          <li>Consultation fees and availability;</li>
          <li>Operational timings;</li>
        </ul>
        <p>is accurate, complete, and up to date at all times.</p>
        <p>
          The Company shall not be responsible for any consequences arising
          from inaccurate or outdated information provided by the Partner.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="5. Prohibited Conduct">
        <p>The Partner and its authorized personnel shall not:</p>
        <ul>
          <li>Manipulate or falsify booking data, consultation records, or revenue information;</li>
          <li>Misuse or exploit User data for marketing or unauthorized purposes;</li>
          <li>Circumvent the Platform to directly solicit or transact with Users outside the Platform;</li>
          <li>Engage in fraudulent, misleading, or deceptive practices;</li>
          <li>Attempt to reverse engineer, disrupt, or interfere with the functioning of the Admin Dashboard or underlying systems.</li>
        </ul>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="6. System Integrity and Security">
        <p>The Partner shall not:</p>
        <ul>
          <li>Introduce any viruses, malware, or harmful code into the Platform;</li>
          <li>Attempt to gain unauthorized access to any part of the Platform or other accounts;</li>
          <li>Interfere with or disrupt the integrity or performance of the Platform.</li>
        </ul>
        <p>
          The Company reserves the right to monitor usage and take appropriate
          action in case of any security threats.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="7. Monitoring and Audit">
        <p>
          The Company reserves the right, at its sole discretion and{' '}
          <strong>without prior notice</strong>, to monitor, review, and assess
          the Partner's use of the Admin Dashboard and related systems for the
          purposes of ensuring compliance with this Policy, the Partner
          Agreement, and Applicable Laws.
        </p>
        <p>Without limitation, the Company may:</p>
        <ul>
          <li>Monitor access logs, usage patterns, and transactional activity on the Admin Dashboard;</li>
          <li>Review data entries, records, communications, and actions undertaken by the Partner through the Platform;</li>
          <li>Conduct periodic or ad hoc audits, including requesting information, documents, or clarifications from the Partner;</li>
          <li>Investigate any suspected misuse, unauthorized activity, data breach, or violation of this Policy or the Partner Agreement.</li>
        </ul>
        <p>The Partner agrees to:</p>
        <ul>
          <li>Provide full cooperation in connection with any such monitoring, review, or audit;</li>
          <li>Furnish accurate and timely information as may be reasonably requested by the Company;</li>
          <li>Facilitate access to relevant records and personnel, to the extent necessary for such audit or investigation.</li>
        </ul>
        <p>
          The Company's exercise of its monitoring and audit rights shall not
          be construed as assuming any responsibility for the Partner's
          operations or services.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="8. Suspension and Restriction">
        <p>
          Without prejudice to any other rights or remedies available under
          the Partner Agreement or Applicable Laws, the Company reserves the
          right to suspend, restrict, or disable, in whole or in part, the
          Partner's access to the Admin Dashboard,{' '}
          <strong>with or without prior notice</strong>, under the following
          circumstances:
        </p>
        <ul>
          <li>Where the Partner is in breach of this Policy, the Partner Agreement, or any applicable law or regulation;</li>
          <li>Where there is a reasonable suspicion of fraudulent, unauthorized, or unlawful activity;</li>
          <li>Where such action is necessary to protect the integrity, security, or functionality of the Platform or to safeguard User data;</li>
          <li>Where required for maintenance, upgrades, technical modifications, or operational continuity of the Platform;</li>
          <li>Where directed by any governmental or regulatory authority.</li>
        </ul>
        <p>
          The Company may, at its discretion, restore access upon resolution
          of the relevant issue to its satisfaction. The Company shall not be
          liable for any loss, damage, or business interruption arising from
          such suspension or restriction.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="9. Disclaimer">
        <p>
          The Admin Dashboard and all associated functionalities are provided
          on an <strong>"as is"</strong> and <strong>"as available"</strong>{' '}
          basis, without any representations or warranties of any kind,
          whether express or implied.
        </p>
        <p>
          To the fullest extent permitted under Applicable Laws, the Company
          disclaims all warranties, including but not limited to:
        </p>
        <ul>
          <li>The uninterrupted, timely, secure, or error-free operation of the Admin Dashboard;</li>
          <li>The accuracy, reliability, or completeness of any data or information displayed;</li>
          <li>The correction of defects or errors;</li>
          <li>The absence of viruses, malware, or other harmful components.</li>
        </ul>
        <p>
          The Company shall not be liable for any loss or damage arising out
          of or in connection with:
        </p>
        <ul>
          <li>Downtime, system failures, or technical disruptions;</li>
          <li>Loss, corruption, or inaccessibility of data;</li>
          <li>Delays in processing or updating information;</li>
          <li>Any reliance placed by the Partner on the Admin Dashboard.</li>
        </ul>
        <p>
          The Partner acknowledges that use of the Admin Dashboard is at its
          own risk.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="10. Modifications">
        <p>
          The Company reserves the right to modify, update, or revise this
          Policy, in whole or in part, at any time, at its sole discretion.
        </p>
        <p>
          Such modifications may be communicated through the Platform, the
          Admin Dashboard, or by other reasonable means. It shall be the
          responsibility of the Partner to periodically review this Policy
          to remain informed of any updates.
        </p>
        <p>
          Continued access to or use of the Admin Dashboard following the
          publication or communication of any modifications shall constitute
          the Partner's deemed acceptance of the revised Policy.
        </p>
        <p>
          If the Partner does not agree to any such modifications, it must
          immediately cease use of the Admin Dashboard and may terminate its
          association with the Platform in accordance with the Partner
          Agreement.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="11. Breach, Penalties and Consequences">
        <h3>11.1 Breach of Policy and Agreement</h3>
        <p>
          Any violation by the Partner or its authorized personnel of this
          Policy, the Partner Agreement, or Applicable Laws shall constitute
          a <strong>material breach</strong>.
        </p>
        <p>
          Without prejudice to any other rights or remedies available to the
          Company, such breach may result in immediate enforcement actions as
          set out in this Clause.
        </p>

        <h3>11.2 Categories of Breach</h3>
        <p>
          For the purposes of enforcement, breaches may include, without
          limitation:
        </p>

        <p><strong>(a) Operational Breaches</strong></p>
        <ul>
          <li>Failure to honour confirmed appointments;</li>
          <li>Repeated cancellations or delays without valid justification;</li>
          <li>Providing inaccurate or misleading information regarding services, doctors, or pricing.</li>
        </ul>

        <p><strong>(b) Data and Confidentiality Breaches</strong></p>
        <ul>
          <li>Unauthorized access, use, disclosure, or sharing of User data;</li>
          <li>Use of patient data for purposes not permitted under the Agreement;</li>
          <li>Failure to implement adequate data protection measures.</li>
        </ul>

        <p><strong>(c) Financial and Platform Misuse</strong></p>
        <ul>
          <li>Circumventing the Platform to transact directly with Users (<strong>"off-platform transactions"</strong>);</li>
          <li>Manipulation of pricing, bookings, or revenue records;</li>
          <li>Fraudulent activities, including fake bookings or misrepresentation of services.</li>
        </ul>

        <p><strong>(d) Legal and Regulatory Breaches</strong></p>
        <ul>
          <li>Non-compliance with Applicable Laws;</li>
          <li>Operating without valid licenses or approvals;</li>
          <li>Engagement in unlawful or unethical practices.</li>
        </ul>

        <h3>11.3 Enforcement Actions</h3>
        <p>
          In the event of a breach, the Company may, at its sole discretion
          and <strong>without prior notice</strong>, take one or more of the
          following actions:
        </p>
        <ul>
          <li>Issue a warning or require corrective action within a specified time;</li>
          <li>Temporarily suspend or restrict access to the Admin Dashboard;</li>
          <li>Permanently disable or terminate the Partner's account;</li>
          <li>Withhold, adjust, or set off any payments or settlements due to the Partner;</li>
          <li>Impose financial penalties or chargebacks for losses incurred;</li>
          <li>Remove or delist the Partner and its services from the Platform;</li>
          <li>Report the matter to relevant regulatory or law enforcement authorities, where required.</li>
        </ul>

        <h3>11.4 Financial Penalties and Set-Off</h3>
        <p>Without prejudice to other remedies, the Company shall have the right to:</p>
        <ul>
          <li>Recover any losses, damages, costs, or expenses incurred due to the Partner's breach;</li>
          <li>Deduct or set off such amounts from any pending or future settlements payable to the Partner;</li>
          <li>Impose reasonable administrative or penalty charges for operational disruptions caused by the Partner.</li>
        </ul>
        <p>The Partner agrees that such deductions shall be valid and binding.</p>

        <h3>11.5 Liability for Losses</h3>
        <p>
          The Partner shall be solely liable for, and shall indemnify the
          Company against, any direct or indirect losses arising from:
        </p>
        <ul>
          <li>Breach of this Policy or the Partner Agreement;</li>
          <li>Claims by Users, regulators, or third parties;</li>
          <li>Data breaches or unauthorized disclosures;</li>
          <li>Medical negligence or service deficiencies.</li>
        </ul>

        <h3>11.6 Right to Immediate Termination</h3>
        <p>
          Notwithstanding anything contained herein, the Company reserves
          the right to immediately terminate access to the Platform, without
          prior notice, in cases involving:
        </p>
        <ul>
          <li>Fraud, wilful misconduct, or gross negligence;</li>
          <li>Serious data breaches or security threats;</li>
          <li>Repeated or material violations of this Policy or the Partner Agreement.</li>
        </ul>

        <h3>11.7 No Waiver</h3>
        <p>
          Failure by the Company to enforce any provision of this Clause at
          any time shall not constitute a waiver of its right to enforce the
          same or any other provision at a later time.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="12. Non-Circumvention and Platform Protection">
        <h3>12.1 Restriction on Off-Platform Transactions</h3>
        <p>
          The Partner expressly agrees that it shall <strong>not, directly
          or indirectly, circumvent, bypass, or avoid the Platform</strong>{' '}
          for the purpose of engaging with Users introduced through the
          Platform.
        </p>
        <p>Without limitation, the Partner shall not:</p>
        <ul>
          <li>Solicit, induce, or encourage any User to book appointments, consultations, or services outside the Platform;</li>
          <li>Share or disclose direct contact details (including phone numbers, email addresses, or physical location details) with the intent of conducting transactions outside the Platform;</li>
          <li>Offer discounts, incentives, or preferential treatment to Users for engaging off-platform;</li>
          <li>Redirect or divert Users to alternative channels, applications, or platforms for completing transactions.</li>
        </ul>

        <h3>12.2 Scope of Restriction</h3>
        <p>The obligations under this Clause shall apply to:</p>
        <ul>
          <li>All Users introduced to the Partner through the Platform;</li>
          <li>Any repeat or follow-up consultations arising from an initial interaction facilitated by the Platform;</li>
          <li>Any communication initiated through the Platform or its associated systems.</li>
        </ul>

        <h3>12.3 Duration</h3>
        <p>The non-circumvention obligations shall:</p>
        <ul>
          <li>Apply during the term of the Partner's association with the Platform; and</li>
          <li>Continue for a period of <strong>[12–24 months]</strong> following termination or expiry of the Partner Agreement, with respect to Users acquired through the Platform.</li>
        </ul>

        <h3>12.4 Mandatory Routing Through Platform</h3>
        <p>
          All bookings, consultations, payments, follow-ups, and related
          transactions involving Users sourced through the Platform shall be
          conducted <strong>exclusively through the Platform</strong>.
        </p>
        <p>
          The Partner acknowledges that the Platform's commission model is
          dependent on such routing and agrees not to undertake any actions
          that may undermine the same.
        </p>

        <h3>12.5 Monitoring and Detection</h3>
        <p>
          The Company reserves the right to monitor, audit, and investigate
          potential circumvention, including:
        </p>
        <ul>
          <li>Analysis of booking patterns and transaction behavior;</li>
          <li>Review of communications and usage data (subject to Applicable Laws);</li>
          <li>Verification through User feedback, complaints, or system alerts.</li>
        </ul>
        <p>The Partner agrees to cooperate fully in any such investigation.</p>

        <h3>12.6 Consequences of Breach</h3>
        <p>
          Without prejudice to other rights and remedies, any breach of this
          Clause shall be deemed a <strong>material breach</strong> and may
          result in:
        </p>
        <ul>
          <li>Immediate suspension or termination of access to the Platform;</li>
          <li>Permanent delisting of the Partner;</li>
          <li>Forfeiture of any pending payments or settlements;</li>
          <li>Recovery of losses, including estimated loss of revenue and commission;</li>
          <li>Imposition of financial penalties, including liquidated damages;</li>
          <li>Initiation of legal proceedings.</li>
        </ul>

        <h3>12.7 Liquidated Damages</h3>
        <p>
          The Partner agrees that any circumvention would result in
          significant and difficult-to-quantify losses to the Company.
        </p>
        <p>
          Accordingly, in the event of a breach, the Partner shall be liable
          to pay <strong>liquidated damages</strong>, which may include:
        </p>
        <ul>
          <li>An amount equivalent to <strong>[X times]</strong> the estimated commission lost; or</li>
          <li>A fixed penalty per identified instance of circumvention;</li>
          <li>Any additional costs incurred in investigation, enforcement, or recovery.</li>
        </ul>
        <p>
          Such amounts shall be recoverable by the Company, including by way
          of set-off against any amounts payable to the Partner.
        </p>

        <h3>12.8 Injunctive Relief</h3>
        <p>
          The Partner acknowledges that breach of this Clause may cause{' '}
          <strong>irreparable harm</strong> to the Company, for which
          monetary damages may be inadequate.
        </p>
        <p>
          Accordingly, the Company shall be entitled to seek injunctive or
          equitable relief, in addition to any other remedies available
          under Applicable Laws, to prevent or restrain such breach.
        </p>

        <h3>12.9 No Circumvention Through Affiliates</h3>
        <p>The Partner shall not circumvent the Platform through:</p>
        <ul>
          <li>Affiliates, subsidiaries, or related entities;</li>
          <li>Doctors, employees, or agents;</li>
          <li>Any third party acting on its behalf.</li>
        </ul>
        <p>
          The Partner shall remain fully responsible for any such actions.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section>
        <div style={{
          marginTop: 32,
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          borderRadius: 16,
          color: '#fff',
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(99,102,241,0.25)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🛡️</div>
          <p style={{
            margin: '0 0 8px',
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
          }}>
            Acknowledgment by Partner
          </p>
          <p style={{
            margin: 0,
            fontSize: 13,
            color: 'rgba(255,255,255,0.9)',
            lineHeight: 1.7,
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            By accessing or using the Medli Admin Dashboard, the Partner
            confirms that it has read, understood, and agreed to be bound by
            this Policy in its entirety, in addition to the Partner
            Agreement.
          </p>
        </div>
      </Section>
    </PolicyLayout>
  )
}