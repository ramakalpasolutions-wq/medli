import PolicyLayout, { Section } from '@/components/PolicyLayout'

export const metadata = {
  title:       'Privacy Policy | Statbook',
  description: 'Privacy Policy of Statbook Platform — operated by Sectirmeld. Learn how we collect, use, and protect your personal data.',
}

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      icon="🔒"
      lastUpdated="May 15, 2026"
      effectiveDate="May 15, 2026"
    >
      <Section>
        <p>
          Welcome to the Privacy Policy of <strong>Statbook Platform</strong>.
        </p>
        <p>
          These Terms of Use (<strong>"Terms"</strong>) govern your access to and use
          of the website and mobile application made available by{' '}
          <strong>Sectirmeld</strong> (hereinafter referred to as the{' '}
          <strong>"Company"</strong>), having its registered address at{' '}
          Petlurivaripalem village, Narasaraopet Mandal, Palnadu District,
          Andhra Pradesh – 522603, India. The Company operates its digital
          healthcare facilitation platform under the brand name{' '}
          <strong>"Statbook"</strong> (hereinafter referred to as{' '}
          <strong>"Statbook"</strong> or the <strong>"Platform"</strong>). The
          Company is committed to safeguarding the privacy and confidentiality of
          personal data shared by Users. This Privacy Policy outlines the manner
          in which the Company collects, uses, processes, stores, and discloses
          personal data in connection with the use of the Platform.
        </p>
        <p>
          In order to provide Users with seamless access to healthcare facilitation
          services, including appointment booking, consultations, and diagnostic
          services, the Company may collect and process certain personal data,
          including sensitive personal data such as health-related information.
          Such processing shall be carried out strictly in accordance with this
          Privacy Policy and applicable data protection laws, including the
          <strong> Digital Personal Data Protection Act, 2023</strong>.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="1. Information We Collect">
        <p>
          The Company is committed to protecting the privacy of Users and ensuring
          appropriate protection and management of personal data shared on the
          Platform. In order to provide and improve its services, the Company may
          collect the following categories of information:
        </p>

        <h3>1.1 Personal Information</h3>
        <p>
          The Company may collect personal information provided by Users at the
          time of registration, booking, or use of the Platform, including but
          not limited to:
        </p>
        <ul>
          <li>Full name;</li>
          <li>Mobile number and email address;</li>
          <li>Age, gender, and location details;</li>
          <li>Login credentials and account-related information;</li>
          <li>Information relating to appointments, consultations, and service preferences.</li>
        </ul>

        <h3>1.2 Health and Sensitive Personal Data</h3>
        <p>
          In connection with the healthcare services facilitated through the
          Platform, the Company may collect and process certain sensitive
          personal data, including:
        </p>
        <ul>
          <li>Medical history and health conditions;</li>
          <li>Symptoms, prescriptions, and diagnostic reports;</li>
          <li>Consultation records and treatment-related information.</li>
        </ul>
        <p>
          Such data shall be collected and processed strictly for the purpose of
          facilitating healthcare services and in accordance with applicable
          data protection laws, including the Digital Personal Data Protection
          Act, 2023.
        </p>

        <h3>1.3 Transaction and Payment Information</h3>
        <p>
          The Company may collect information relating to payments made through
          the Platform, including:
        </p>
        <ul>
          <li>Transaction details;</li>
          <li>Billing information;</li>
          <li>Payment status and history.</li>
        </ul>
        <p>
          The Company does not store complete payment card details and relies on
          secure third-party payment gateways for processing transactions.
        </p>

        <h3>1.4 Usage and Technical Information</h3>
        <p>
          The Company may automatically collect certain technical and
          usage-related information, including:
        </p>
        <ul>
          <li>IP address and device information;</li>
          <li>Browser type and operating system;</li>
          <li>Pages visited, features used, and time spent on the Platform;</li>
          <li>Log data, cookies, and similar tracking technologies.</li>
        </ul>
        <p>
          Such information is used for analytics, security, and improvement of
          the Platform.
        </p>

        <h3>1.5 Information from Non-Registered Users</h3>
        <p>
          This Privacy Policy also applies to individuals who access or use the
          Platform without registering an account. The Company may collect
          limited information from such users, including:
        </p>
        <ul>
          <li>Browsing behaviour and navigation patterns;</li>
          <li>Pages viewed and interaction with content;</li>
          <li>Device and technical information.</li>
        </ul>

        <h3>1.6 Information from Third Parties</h3>
        <p>
          The Company may receive information about Users from third-party
          sources, including Service Providers or integrated services, to the
          extent necessary for providing services on the Platform.
        </p>

        <p>
          This privacy policy also applies to data we collect from users who are
          not registered as members of this Platform, including, but not limited
          to, browsing behavior, pages viewed etc.
        </p>
        <p>
          We only collect and use such information collected from you that we
          consider necessary for achieving a seamless, efficient, and safe
          experience in using the platform, customized to your needs including:
        </p>
        <ul>
          <li>To enable the provision of services opted for by you;</li>
          <li>To enable the viewing of content in your interest;</li>
          <li>To communicate the necessary account and service-related information from time to time;</li>
          <li>To allow you to receive quality customer care services and data Collection;</li>
          <li>To comply with applicable laws, rules and regulations;</li>
        </ul>
        <p>
          Where any service requested by You involves a third party, such
          information as is reasonably necessary to carry out Your service
          request may be shared with such third party.
        </p>
        <p>
          We also use your contact information to send you offers based on your
          interests and prior activity and also to show the content preferred by
          you. We shall immediately delete all such information upon withdrawal
          of your consent for the same through the <strong>'unsubscribe'</strong> button or
          through an email to be sent to{' '}
          <a href="mailto:grievanceofficer@statbook.com">grievanceofficer@statbook.com</a>.
        </p>
        <p>
          To the extent possible, we provide you with an option of not divulging
          any specific information that you wish for us not to collect, store, or
          use. You may also choose not to use a particular service or feature on
          the Platform and opt-out of any non-essential communications from the
          Platform.
        </p>
        <p>
          Further, transacting over the internet has inherent risks which can
          only be avoided by you following security practices yourself, such as
          not revealing account/login-related information to any other person and
          informing our customer care team about any suspicious activity or where
          your account has/may have been compromised.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="2. Our Use of Your Information">
        <p>
          The Company processes personal data collected from Users for lawful
          purposes connected with the operation, improvement, and security of
          the Platform, and in accordance with applicable data protection laws,
          including the Digital Personal Data Protection Act, 2023.
        </p>

        <h3>2.1 Purpose of Processing</h3>
        <p>The information provided by Users may be used for the following purposes:</p>
        <ul>
          <li>To facilitate and provide healthcare-related services requested by the User, including appointment bookings, consultations, and diagnostic services;</li>
          <li>To enable communication between Users and Service Providers, including confirmations, reminders, and updates relating to appointments or services;</li>
          <li>To maintain internal records, including transaction history, consultation details, and operational logs;</li>
          <li>To improve, personalize, and enhance the quality, functionality, and performance of the Platform and Services;</li>
          <li>To comply with legal, regulatory, and statutory obligations, including record-keeping requirements;</li>
          <li>To detect, prevent, and address fraud, misuse, security breaches, or technical issues;</li>
          <li>To send important service-related communications, including notices, updates, and policy changes.</li>
        </ul>

        <h3>2.2 Use of Health and Sensitive Personal Data</h3>
        <p>
          Health-related and other sensitive personal data shall be processed
          strictly for the purpose of facilitating healthcare services, including
          enabling consultations, sharing relevant medical information with
          Service Providers, and maintaining medical records where required.
        </p>
        <p>
          Such data shall not be used for any purpose unrelated to the provision
          of healthcare services, except as required or permitted under
          Applicable Laws.
        </p>

        <h3>2.3 Communication</h3>
        <p>
          The Company may use User contact information to send service-related
          communications, including appointment confirmations, reminders,
          transactional updates, and support-related messages.
        </p>
        <p>
          Users may also receive limited notifications regarding Platform updates
          or service enhancements. For further details, Users may refer to the
          Terms of Use.
        </p>

        <h3>2.4 Usage Data and Analytics</h3>
        <p>
          The Company may use technical and usage-related information, including
          IP addresses, device identifiers, browser type, and interaction data,
          to:
        </p>
        <ul>
          <li>Identify Users and maintain account security;</li>
          <li>Analyse usage patterns and user behaviour;</li>
          <li>Improve Platform performance and user experience;</li>
          <li>Develop new features and services.</li>
        </ul>
        <p>
          The Company may use third-party analytics and tracking tools to better
          understand User engagement and optimize the Platform. Such tools may
          use cookies and similar technologies in accordance with applicable
          laws.
        </p>

        <h3>2.5 Data Sharing and Disclosure</h3>
        <p>The Company does not sell, rent, or trade User personal data.</p>
        <p>However, personal data may be shared in the following circumstances:</p>
        <ul>
          <li>With Service Providers (such as doctors, hospitals, and laboratories) to facilitate the requested services;</li>
          <li>With third-party service providers acting on behalf of the Company, including payment processors, communication service providers, and analytics providers, subject to confidentiality obligations;</li>
          <li>Where required to comply with legal obligations, enforce agreements, or respond to lawful requests by governmental or regulatory authorities.</li>
        </ul>

        <h3>2.6 System Administration and Security</h3>
        <p>
          Information collected through server logs, including IP addresses and
          browsing activity, may be used for system administration, monitoring,
          and troubleshooting purposes, as well as for maintaining the security
          and integrity of the Platform.
        </p>

        <h3>2.7 Personalization and Improvements</h3>
        <p>
          The Company may use collected information to tailor content,
          recommendations, and service offerings based on User preferences and
          usage patterns, with the objective of enhancing User experience.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="3. How Information is Collected">
        <p>
          Before or at the time of collecting personal information, we will
          identify the purposes for which information is being collected. If the
          same is not identified to you, you have the right to request the
          Company to explain the purpose of the collection of said personal
          information, pending the fulfillment of which you shall not be
          mandated to disclose any information whatsoever.
        </p>
        <p>
          We will collect and use your personal information solely to fulfill
          those purposes specified by us, within the scope of the consent of the
          individual concerned or as required by law. We will only retain
          personal information as long as necessary for the fulfillment of those
          purposes. We will collect personal information by lawful and fair means
          and with the knowledge and consent of the individual concerned.
        </p>
        <p>
          Personal data should be relevant to the purposes for which it is to be
          used, and, to the extent necessary for those purposes, should be
          accurate, complete, and up-to-date.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="4. External Links on the Platform">
        <p>
          The Platform may contain links to third-party websites, applications,
          services, or resources, including advertisements, integrations, and
          external service providers (collectively, <strong>"Third-Party Platforms"</strong>).
        </p>
        <p>
          Such Third-Party Platforms are not owned, operated, or controlled by
          the Company. The inclusion of any links or references on the Platform
          is provided solely for the convenience of Users and does not
          constitute any endorsement, sponsorship, or recommendation by the
          Company.
        </p>

        <h3>4.1 No Control or Responsibility</h3>
        <p>The Company does not control and shall not be responsible for:</p>
        <ul>
          <li>The availability, accessibility, or functionality of any Third-Party Platforms;</li>
          <li>The content, accuracy, completeness, or reliability of any information, advertisements, or materials available on such platforms;</li>
          <li>The services or products offered by such third parties.</li>
        </ul>
        <p>Users acknowledge that access to and use of Third-Party Platforms is at their own risk.</p>

        <h3>4.2 No Liability</h3>
        <p>
          To the fullest extent permitted under Applicable Laws, the Company
          shall not be liable for any loss or damage, whether direct or indirect,
          arising out of or in connection with:
        </p>
        <ul>
          <li>The use of or reliance on any Third-Party Platforms;</li>
          <li>Any transactions, communications, or dealings between Users and such third parties;</li>
          <li>Any deficiencies, failures, or misconduct on the part of such third parties.</li>
        </ul>

        <h3>4.3 Third-Party Privacy Practices</h3>
        <p>
          Third-Party Platforms may have their own privacy policies and data
          handling practices governing the collection, storage, use, and
          disclosure of personal data.
        </p>
        <p>
          The Company does not control or assume responsibility for such
          practices. Users are advised to review the privacy policies and terms
          of use of such Third-Party Platforms before accessing or using their
          services.
        </p>

        <h3>4.4 External Integrations</h3>
        <p>
          The Platform may integrate with third-party services, including but
          not limited to payment gateways, communication tools, and analytics
          providers. While the Company endeavours to work with reputable service
          providers, it does not guarantee the performance, security, or
          reliability of such integrations.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="5. Cookies">
        <p>
          A cookie is a small file of letters and numbers that we store on your
          browser or the hard drive of your computer if you agree. By continuing
          to browse the site, you are agreeing to our use of cookies. Cookies
          contain information that is transferred to your computer's hard drive.
          You can set your browser to refuse all or some browser cookies, or to
          alert you when Platforms set or access cookies. If you disable or
          refuse cookies, please note that some parts of this Platform may
          become inaccessible or not function properly. A list of the type of
          cookies we use is as follows:
        </p>
        <ul>
          <li><strong>Strictly necessary cookies.</strong> These are cookies that are required for the operation of our Platform. They include, for example, cookies that enable you to log into secure areas of our Platform, use a shopping cart or make use of e-billing services.</li>
          <li><strong>Analytical/performance cookies.</strong> They allow us to recognize and count the number of visitors and to see how visitors move around our Platform when they are using it. This helps us to improve the way our Platform works, for example, by ensuring that users are finding what they are looking for easily.</li>
          <li><strong>Functionality cookies.</strong> These are used to recognize you when you return to our Platform. This enables us to personalize our content for you, greet you by name and remember your preferences (for example, your choice of language or region).</li>
          <li><strong>Targeting cookies.</strong> These cookies record your visit to our Platform, the pages you have visited and the links you have followed. We will use this information to make our Platform and the advertising displayed on it more relevant to your interests. We may also share this information with third-parties for this purpose.</li>
        </ul>
        <p>
          Please note that third-parties (including, for example, advertising
          networks and providers of external services like web traffic analysis
          services) may also use cookies, over which we have no control. These
          cookies are likely to be analytical/performance cookies or targeting
          cookies. You can block cookies by activating the setting on your
          browser that allows you to refuse the setting of all or some cookies.
          However, if you use your browser settings to block all cookies
          (including essential cookies) you may not be able to access all or
          parts of our Platform.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="6. Your Rights">
        <p>Unless subject to an exemption, you have the following rights concerning your data:</p>
        <ul>
          <li>The right to request a copy of your data which we hold about you;</li>
          <li>The right to request for any correction to any personal data if it is found to be inaccurate or out of date;</li>
          <li>The right to withdraw Your consent to the processing at any time;</li>
          <li>The right to object to the processing of personal data;</li>
          <li>The right to complain about a supervisory authority;</li>
          <li>The right to obtain information as to whether personal data are transferred to a third country or an international organization.</li>
        </ul>
        <p>
          Where you hold an account with any of our services, you are entitled
          to a copy of all personal data which we hold concerning you. You are
          also entitled to request that we restrict how we use your data in your
          account when you log in.
        </p>
        <p>
          The Company shall process personal data only for lawful purposes,
          including for the provision of services, compliance with legal
          obligations, and other legitimate uses permitted under applicable
          laws. Wherever required, the Company shall obtain the User's consent
          prior to the collection and processing of personal data.
        </p>
        <p>
          At the time of seeking consent, the Company shall provide clear and
          adequate notice to the User specifying:
        </p>
        <ul>
          <li>the nature and categories of personal data being collected;</li>
          <li>the purpose(s) for which such data is being processed;</li>
          <li>the manner in which such data may be used or shared;</li>
          <li>the procedure for withdrawal of consent; and</li>
          <li>the mechanism available to the User for grievance redressal.</li>
        </ul>
        <p>
          Consent obtained from Users shall be free, specific, informed,
          unconditional, and unambiguous, and shall be evidenced through a clear
          affirmative action.
        </p>
        <p>
          Users shall have the right to withdraw their consent at any time by
          following the procedure specified on the Platform. Upon such
          withdrawal, the Company shall cease processing of the relevant
          personal data, unless such processing is required or permitted under
          applicable laws. The withdrawal of consent shall not affect the
          lawfulness of any processing carried out prior to such withdrawal.
        </p>
        <p>
          Users acknowledge that withdrawal of consent or refusal to provide
          certain personal data may result in limited access to certain features
          or services on the Platform.
        </p>
        <p>
          The Company implements reasonable technical and organizational
          measures to protect personal data against unauthorized access,
          disclosure, alteration, or destruction. However, while the Company
          endeavours to protect User information, it does not guarantee absolute
          security.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="7. Compliances">
        <ol>
          <li>
            This legal agreement is an electronic record in terms of the Indian
            Information Technology Act, 2000 and rules there under as applicable
            and the amended provisions about electronic records in various
            statutes as amended by the Indian Information Technology Act, 2000.
            This electronic record is generated by a computer system and does
            not require any physical or digital signatures.
          </li>
          <li>
            This legal document is published in accordance with the provisions
            of Rule 3 (1) of the Indian Information Technology (Intermediaries
            guidelines) Rules, 2011 and Rule 4 of the Information Technology
            (Reasonable security practices and procedures and sensitive personal
            data or information) Rules, 2011 of Information Technology Act,
            2000 amended through Information Technology Amendment Act, 2008
            that require publishing the Terms of Use and practices for access
            and usage of any functional Platform.
          </li>
          <li>
            This Privacy Policy is formulated in compliance with the provisions
            of <strong>THE DIGITAL PERSONAL DATA PROTECTION ACT, 2023</strong>,
            and any other relevant data protection laws applicable to the
            processing of personal data. The policy outlines the principles and
            procedures for collecting, processing, and safeguarding personal
            data in adherence to the statutory requirements set forth by THE
            DIGITAL PERSONAL DATA PROTECTION ACT, 2023. Users are encouraged to
            review and understand this Privacy Policy in conjunction with the
            applicable data protection laws.
          </li>
        </ol>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="8. Data Fiduciary and Data Principal">
        <p>
          For the purposes of this Privacy Policy and in accordance with
          applicable data protection laws, including the Digital Personal Data
          Protection Act, 2023:
        </p>
        <ul>
          <li>The Company shall act as the <strong>"Data Fiduciary,"</strong> being the entity that determines the purpose and means of processing personal data collected through the Platform;</li>
          <li>The User shall be regarded as the <strong>"Data Principal,"</strong> being the individual to whom the personal data relates;</li>
          <li>The Company, as the Data Fiduciary, shall process personal data in a lawful, fair, and transparent manner, and shall ensure that such processing is limited to the purposes specified in this Privacy Policy or as otherwise permitted under Applicable Laws;</li>
          <li>The Company shall implement appropriate technical and organizational measures to ensure compliance with its obligations as a Data Fiduciary, including ensuring data accuracy, security, and accountability in processing activities;</li>
          <li>The User, as the Data Principal, shall have rights in relation to their personal data, including the right to access, correct, and request deletion of such data, and to withdraw consent in accordance with Applicable Laws.</li>
        </ul>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="9. Processing of Children's Data">
        <p>
          The Company recognizes the need for enhanced protection of personal
          data relating to children.
        </p>
        <ul>
          <li>For the purposes of this Policy, a <strong>"child"</strong> shall mean any individual below the age of <strong>eighteen (18) years</strong>;</li>
          <li>The Company shall not process personal data of a child without obtaining verifiable consent from the parent or lawful guardian, in such manner as may be prescribed under Applicable Laws;</li>
          <li>The Company shall implement appropriate measures to verify that consent for processing of a child's data has been provided by a parent or lawful guardian;</li>
          <li>The Company shall not undertake tracking, behavioural monitoring, or targeted advertising directed at children;</li>
          <li>The Company shall process children's data only for purposes that are necessary for providing healthcare facilitation services and in a manner that is in the best interests of the child;</li>
          <li>The Company shall implement enhanced safeguards, including restricted access controls and data minimization practices, while handling children's personal data.</li>
        </ul>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="10. Data Breach and Incident Response">
        <p>
          The Company maintains appropriate technical and organizational
          measures to safeguard personal data against unauthorized access,
          disclosure, alteration, or destruction.
        </p>
        <ul>
          <li>In the event of a data breach or security incident involving personal data, the Company shall take prompt and reasonable steps to identify, contain, and mitigate the impact of such breach;</li>
          <li>The Company shall assess the nature and extent of the breach, including the type of data affected, the number of Users impacted, and the potential risks arising therefrom;</li>
          <li>Where required under Applicable Laws, the Company shall notify the relevant regulatory authorities and affected Users of such breach, within such timelines as may be prescribed;</li>
          <li>Such notification, where applicable, shall include relevant details of the breach, potential consequences, and measures taken or proposed to mitigate any adverse effects;</li>
          <li>The Company shall take appropriate remedial actions to prevent recurrence of such incidents, including strengthening security measures and reviewing internal processes;</li>
          <li>Users acknowledge that, despite reasonable safeguards, no system can be completely secure, and the Company shall not be liable for breaches occurring due to factors beyond its reasonable control.</li>
        </ul>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="11. Cross-Border Transfer of Data">
        <p>
          The Company may, in the course of providing services, transfer, store,
          or process personal data outside the territory of India.
        </p>
        <ul>
          <li>Such cross-border transfer of personal data shall be carried out only in accordance with Applicable Laws, including restrictions or conditions prescribed under the Digital Personal Data Protection Act, 2023;</li>
          <li>The Company shall ensure that any recipient of personal data outside India provides an adequate level of data protection and implements appropriate safeguards to protect such data;</li>
          <li>Cross-border transfers may occur where necessary for service facilitation, including hosting, data storage, analytics, or use of third-party service providers;</li>
          <li>The Company shall take reasonable steps to ensure that such transfers do not compromise the security or confidentiality of personal data;</li>
          <li>By using the Platform and providing personal data, Users consent to such transfer, storage, and processing of their data in jurisdictions outside India, subject to Applicable Laws.</li>
        </ul>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="12. Confidentiality">
        <h3>12.1 Platform Confidential Information</h3>
        <p>
          Users acknowledge that the Platform may contain certain information,
          materials, and content that are proprietary and confidential to the
          Company (<strong>"Confidential Information"</strong>), including but not
          limited to technical data, business processes, platform features, and
          other non-public information.
        </p>
        <p>
          Users agree not to disclose, reproduce, distribute, or otherwise use
          such Confidential Information without the prior written consent of the
          Company, except as expressly permitted under the Terms of Use.
        </p>

        <h3>12.2 Confidentiality of User Information</h3>
        <p>
          The Company treats all personal data shared by Users as confidential
          and shall take reasonable measures to protect such information against
          unauthorized access, use, disclosure, or alteration.
        </p>
        <p>The Company shall not disclose personal data to third parties except:</p>
        <ul>
          <li>As required to facilitate services through the Platform (including sharing with hospitals, doctors, and diagnostic service providers);</li>
          <li>With third-party service providers acting on behalf of the Company, subject to appropriate confidentiality obligations;</li>
          <li>Where required to comply with Applicable Laws or lawful requests from governmental or regulatory authorities;</li>
          <li>With the consent of the User.</li>
        </ul>
        <p>
          All such processing shall be carried out in accordance with applicable
          data protection laws, including the Digital Personal Data Protection
          Act, 2023.
        </p>

        <h3>12.3 Communication</h3>
        <p>
          The Company may use User contact information, including email and
          mobile number, to send communications strictly related to the
          provision of services, including appointment confirmations, reminders,
          updates, and support-related messages.
        </p>
        <p>
          The Company shall not use User contact information for unsolicited
          communications unrelated to the Platform's services. Users may opt out
          of non-essential communications, where applicable, in accordance with
          the options provided on the Platform.
        </p>

        <h3>12.4 Exceptions</h3>
        <p>
          Notwithstanding the foregoing, the Company shall not be responsible
          for disclosure of information:
        </p>
        <ul>
          <li>Which is already in the public domain through no fault of the Company;</li>
          <li>Which is lawfully received from a third party without restriction;</li>
          <li>Which is disclosed pursuant to a legal obligation or court order;</li>
          <li>Which is disclosed with the User's consent.</li>
        </ul>

        <h3>12.5 No Absolute Security</h3>
        <p>
          While the Company implements reasonable security practices and
          procedures to safeguard User information, Users acknowledge that no
          method of transmission over the internet or method of electronic
          storage is completely secure, and the Company does not guarantee
          absolute security of information.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="13. Other Information Collectors">
        <p>
          Except as otherwise expressly included in this Privacy Policy, this
          document only addresses the use and disclosure of information we
          collect from you. To the extent that you disclose your information to
          other parties, whether they are on our Platform or other sites
          throughout the Internet, different rules may apply to their use or
          disclosure of the information you disclose to them. To the extent that
          we use third party advertisers, they adhere to their privacy policies.
          Since we do not control the privacy policies of third parties, you are
          subject to ask questions before you disclose your personal information
          to others.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="14. Our Disclosure of Your Information">
        <h3>14.1 General Disclosure Principles</h3>
        <p>
          The Company is committed to protecting the confidentiality of User
          information and shall not disclose personal data except in accordance
          with this Privacy Policy and Applicable Laws, including the Digital
          Personal Data Protection Act, 2023.
        </p>
        <p>
          While the Company implements reasonable security practices and
          safeguards, Users acknowledge that, due to the nature of digital
          communications and the regulatory environment, absolute confidentiality
          of information cannot be guaranteed.
        </p>

        <h3>14.2 No Sale of Personal Data</h3>
        <p>
          As a matter of policy, the Company does not sell, rent, or trade
          personally identifiable information of Users to any third party.
        </p>

        <h3>14.3 Disclosure for Service Facilitation</h3>
        <p>
          The Company may disclose personal data to third parties strictly to
          the extent necessary for providing services on the Platform,
          including:
        </p>
        <ul>
          <li><strong>Healthcare Service Providers</strong> such as hospitals, doctors, and diagnostic laboratories for the purpose of facilitating consultations, bookings, and treatment;</li>
          <li><strong>Third-party service providers</strong> engaged by the Company, including payment processors, communication service providers, and technical support providers, who are contractually bound by confidentiality obligations.</li>
        </ul>

        <h3>14.4 External Service Providers</h3>
        <p>
          The Platform may integrate or provide access to services offered by
          third-party providers. Where Users choose to avail such services and
          share information with such third parties:
        </p>
        <ul>
          <li>The collection and use of such information shall be governed by the respective third party's privacy policy;</li>
          <li>The Company shall not be responsible for the data practices of such third parties.</li>
        </ul>
        <p>
          Users are advised to review the privacy policies of such third-party
          service providers before sharing their information.
        </p>

        <h3>14.5 Legal and Regulatory Disclosures</h3>
        <p>The Company may disclose personal data:</p>
        <ul>
          <li>To comply with Applicable Laws, legal processes, or regulatory requirements;</li>
          <li>In response to lawful requests from courts, law enforcement agencies, or government authorities;</li>
          <li>To enforce the Terms of Use, Partner Agreement, or other policies;</li>
          <li>To investigate, prevent, or address suspected fraud, security issues, or illegal activities;</li>
          <li>To protect the rights, property, or safety of the Company, Users, or the public.</li>
        </ul>
        <p>Users expressly authorize the Company to make such disclosures where deemed necessary.</p>

        <h3>14.6 Business Transfers</h3>
        <p>
          In the event of a merger, acquisition, restructuring, or sale of
          assets, User information may be transferred as part of such
          transaction, subject to applicable confidentiality and data protection
          obligations.
        </p>

        <h3>14.7 User Notification</h3>
        <p>
          Where required under Applicable Laws or where reasonably practicable,
          the Company may notify Users of disclosures of their personal data.
          However, the Company shall not be obligated to provide such notice
          where disclosure is required by law, regulatory direction, or where
          such notification is prohibited.
        </p>

        <h3>14.8 Limitation of Liability</h3>
        <p>
          To the fullest extent permitted under Applicable Laws, the Company
          shall not be liable for any disclosure of personal data:
        </p>
        <ul>
          <li>Made in compliance with legal obligations;</li>
          <li>Resulting from unauthorized access beyond the reasonable control of the Company;</li>
          <li>Arising from the actions or omissions of third-party service providers.</li>
        </ul>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="15. Accessing, Reviewing and Changing Your Profile">
        <p>
          You can review and change the information you submitted except Email
          ID. An option for facilitating such change shall be present on the
          Platform and such change shall be facilitated by the User. If you
          change any information, we may or may not keep track of your old
          information. We will not retain in our files information you have
          requested to remove for certain circumstances, such as to resolve
          disputes, troubleshoot problems, and enforce our terms and conditions.
          Such prior information shall be completely removed from our databases,
          including stored 'back up' systems. If you believe that any
          information, we are holding on to you is incorrect or incomplete, or
          to remove your profile so that others cannot view it, the User needs
          to remediate, and promptly correct any such incorrect information.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="16. Data Retention and Deletion">
        <h3>16.1 Retention of Personal Data</h3>
        <p>
          The Company shall retain personal data, including sensitive personal
          data such as health-related information, only for as long as necessary
          to:
        </p>
        <ul>
          <li>Fulfil the purposes for which such data was collected, including facilitating healthcare services, consultations, and transactions on the Platform;</li>
          <li>Comply with applicable legal, regulatory, and statutory obligations;</li>
          <li>Resolve disputes, enforce agreements, and maintain records for audit and compliance purposes.</li>
        </ul>
        <p>
          Such retention shall be carried out in accordance with applicable
          laws, including the Digital Personal Data Protection Act, 2023.
        </p>

        <h3>16.2 Retention of Health Data</h3>
        <p>
          Health-related and medical information may be retained for longer
          durations where necessary:
        </p>
        <ul>
          <li>To ensure continuity of care and future consultations;</li>
          <li>To comply with applicable healthcare and record-keeping requirements;</li>
          <li>To address medico-legal obligations and claims.</li>
        </ul>
        <p>
          The Company shall ensure that such data is retained only to the
          extent necessary and is subject to appropriate safeguards.
        </p>

        <h3>16.3 Criteria for Determining Retention Period</h3>
        <p>
          The duration for which personal data is retained shall be determined
          based on factors including:
        </p>
        <ul>
          <li>The nature and sensitivity of the data;</li>
          <li>The purpose for which the data was collected;</li>
          <li>Legal, regulatory, or contractual requirements;</li>
          <li>The need to prevent fraud, resolve disputes, or enforce rights.</li>
        </ul>

        <h3>16.4 Deletion of Personal Data</h3>
        <p>The Company shall delete or anonymize personal data:</p>
        <ul>
          <li>Upon fulfilment of the purpose for which it was collected;</li>
          <li>Upon withdrawal of consent by the User, unless retention is required or permitted under Applicable Laws;</li>
          <li>Upon receipt of a valid request for deletion, subject to verification and legal requirements.</li>
        </ul>

        <h3>16.5 User-Initiated Deletion Requests</h3>
        <p>
          Users may request deletion of their personal data by contacting the
          Company through the grievance redressal mechanism.
        </p>
        <p>Upon receipt of such request:</p>
        <ul>
          <li>The Company shall verify the identity of the User;</li>
          <li>Evaluate the request in accordance with applicable laws;</li>
          <li>Delete or anonymize the data within a reasonable time, unless retention is required for legal or legitimate purposes.</li>
        </ul>
        <p>
          Users acknowledge that deletion of certain data may result in the
          inability to access or use certain features of the Platform.
        </p>

        <h3>16.6 Exceptions to Deletion</h3>
        <p>
          The Company may retain certain personal data notwithstanding a
          deletion request, where such retention is necessary:
        </p>
        <ul>
          <li>To comply with legal or regulatory obligations;</li>
          <li>To establish, exercise, or defend legal claims;</li>
          <li>To prevent fraud, abuse, or security threats;</li>
          <li>For legitimate business purposes permitted under Applicable Laws.</li>
        </ul>

        <h3>16.7 Anonymization and Aggregation</h3>
        <p>
          The Company may anonymize or aggregate personal data in such a manner
          that it no longer identifies an individual User. Such anonymized data
          may be retained and used for analytics, research, and improvement of
          services without restriction.
        </p>

        <h3>16.8 Secure Deletion</h3>
        <p>
          The Company shall implement reasonable technical and organizational
          measures to ensure secure deletion or destruction of personal data
          when it is no longer required, so as to prevent unauthorized access or
          recovery.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="17. Security">
        <p>
          We treat data as an asset that must be protected against loss and
          unauthorized access. We employ many different security techniques to
          protect such data from unauthorized access by members inside and
          outside the Firm. We follow generally accepted industry standards to
          protect the Personal Information submitted to us and information that
          we have accessed.
        </p>
        <p>
          However, as effective as encryption technology is, no security system
          is impenetrable. Our Firm cannot guarantee the security of our
          database, nor can we guarantee that information you provide won't be
          intercepted while being transmitted to the Firm over the Internet.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="18. Severability">
        <p>
          Each paragraph of this Privacy Policy shall be and remain separate
          from and independent of and severable from all and any other
          paragraphs herein except where otherwise expressly indicated or
          indicated by the context of the agreement. The decision or declaration
          that one or more of the paragraphs are null and void shall not affect
          the remaining paragraphs of this privacy policy.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="19. Amendment">
        <p>
          Our Privacy Policy may change from time to time. The most current
          version of the policy will govern our use of your information and will
          always be on the Platform. Any amendments to this Policy shall be
          deemed as accepted by the User on their continued use of the Platform.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="20. Consent Withdrawal, Data Download & Data Removal Requests">
        <p>
          To withdraw your consent, or to request the download or delete your
          data with us for any or all our services at any time, please email to{' '}
          <a href="mailto:grievanceofficer@statbook.com">
            grievanceofficer@statbook.com
          </a>
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="21. Disclaimer">
        <p>
          We do not store any account related information or any credit / debit
          card details. We shall not be liable for any loss or damage sustained
          by Users as a result of any disclosure (inadvertent or otherwise) of
          any information concerning the User's account, credit cards or debit
          cards in the course of any online transactions or payments made for
          any products and/or services offered through the Platform.
        </p>
        <p>
          In case any Personal Information is shared by you with us, which is
          not requested by us during registration, (whether mandatorily or
          optionally), we will not be liable for any information security breach
          or disclosure in relation to such information.
        </p>
      </Section>

      {/* ───────────────────────────────────────────────────────────── */}
      <Section title="22. Data Protection Officer / Grievance Officer">
        <p>
          In accordance with applicable laws, including the Digital Personal
          Data Protection Act, 2023 and the Information Technology (Intermediary
          Guidelines and Digital Media Ethics Code) Rules, 2021, the Company
          has designated a <strong>Grievance Officer</strong> to address any
          complaints, concerns, or queries relating to the processing of
          personal data and use of the Platform.
        </p>
        <p>
          Users may contact the Grievance Officer for matters including, but
          not limited to:
        </p>
        <ul>
          <li>Issues relating to collection, use, or disclosure of personal data;</li>
          <li>Requests for access, correction, or deletion of personal data;</li>
          <li>Withdrawal of consent;</li>
          <li>Concerns regarding unauthorized access or data breaches;</li>
          <li>Any other grievance arising out of the use of the Platform.</li>
        </ul>

        <h3>Contact Details</h3>
        <p>
          Users may submit their grievances or requests to the Grievance Officer
          using the following details:
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

        <h3>Grievance Redressal Process</h3>
        <ul>
          <li>The Company shall acknowledge receipt of the grievance within <strong>twenty-four (24) hours</strong> of receipt;</li>
          <li>The Company shall endeavour to resolve the grievance within <strong>fifteen (15) days</strong> from the date of receipt, or within such reasonable time as may be required depending on the nature of the grievance;</li>
          <li>Users may be required to provide additional information or documentation for effective resolution.</li>
        </ul>

        <h3>Escalation</h3>
        <p>
          If the User is not satisfied with the resolution provided, the User
          may escalate the matter in accordance with Applicable Laws.
        </p>
        <p>
          Nothing contained herein shall limit the User's right to seek
          remedies before appropriate legal or regulatory authorities.
        </p>
      </Section>
    </PolicyLayout>
  )
}