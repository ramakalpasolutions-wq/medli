import PolicyLayout from "@/components/PolicyLayout";

export const metadata = {
  title: "About Us | Medli",
  description:
    "Learn about Medli — a healthcare appointment booking platform by Sectirmeld LLP, connecting patients with doctors and diagnostic labs.",
};

export default function AboutPage() {
  return (
    <PolicyLayout
      title="About Medli"
      badge="About Us"
      lastUpdated="January 2025"
    >
      {/* ── Parent Company ── */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          Our Parent Company — Sectirmeld LLP
        </h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          <strong>Sectirmeld LLP</strong> is a forward-thinking technology company dedicated to building digital solutions that simplify everyday life. With a strong focus on healthcare innovation, software solutions, and digital infrastructure, Sectirmeld LLP incubates and operates product-driven ventures to solve real-world problems.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Our mission is to harness modern technology to bridge gaps in essential services — making healthcare delivery fast, transparent, and accessible across India.
        </p>
      </section>

      {/* ── Medli ── */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          Medli — Healthcare Appointments, Simplified
        </h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          <strong>Medli</strong> is a dedicated healthcare booking product operating under <strong>Sectirmeld LLP</strong>. Medli specializes exclusively in appointment booking, connecting patients directly with qualified <strong>doctors</strong> and accredited <strong>diagnostic labs</strong>.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Doctor Appointments */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6">
            <h3 className="text-lg font-semibold text-blue-950 mb-2 flex items-center gap-2">
              🩺 Doctor Appointments
            </h3>
            <p className="text-blue-900/80 text-sm leading-relaxed">
              Find verified doctors across specialties and partner hospitals. Book in-clinic consultations or video telehealth appointments seamlessly with real-time slot availability.
            </p>
          </div>

          {/* Lab Appointments */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6">
            <h3 className="text-lg font-semibold text-emerald-950 mb-2 flex items-center gap-2">
              🔬 Diagnostic Lab Tests
            </h3>
            <p className="text-emerald-900/80 text-sm leading-relaxed">
              Discover certified diagnostic centers, compare tests and health packages, schedule home sample collections or center visits, and access digital lab reports online.
            </p>
          </div>
        </div>
      </section>

      {/* ── Key Features ── */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          What Makes Medli Different?
        </h2>
        <ul className="list-disc list-inside text-gray-600 space-y-2.5 leading-relaxed">
          <li>
            <strong>Doctor & Lab Unified</strong> — Manage all medical appointments and diagnostic tests in a single platform.
          </li>
          <li>
            <strong>Verified Providers</strong> — Every hospital, clinic, doctor, and diagnostic laboratory is thoroughly vetted.
          </li>
          <li>
            <strong>Transparent Booking & Pricing</strong> — Clear pricing with zero hidden fees and instant invoices.
          </li>
          <li>
            <strong>Seamless Telehealth</strong> — Integrated video consultations for convenient remote care.
          </li>
          <li>
            <strong>Family Health Management</strong> — Book slots and track medical appointments for all family members under one account.
          </li>
        </ul>
      </section>

      {/* ── Contact & Support ── */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          Contact Us
        </h2>
        <p className="text-gray-600 leading-relaxed mb-2">
          For business inquiries, partnerships, or support regarding Sectirmeld LLP and Medli:
        </p>
        <p className="text-gray-700">
          <strong>Entity:</strong> Sectirmeld LLP<br />
          <strong>Product:</strong> Medli Healthcare Platform<br />
          <strong>Support:</strong>{" "}
          <a href="mailto:support@medli.in" className="text-blue-600 underline">
            support@medli.in
          </a>
        </p>
      </section>
    </PolicyLayout>
  );
}