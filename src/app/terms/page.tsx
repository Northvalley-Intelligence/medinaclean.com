import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for using the Medina Clean website, estimates, and appointment requests.",
  alternates: { canonical: "/terms" }
};

export default function TermsPage() {
  return (
    <main className="section">
      <div className="section-inner">
        <p className="eyebrow">Terms</p>
        <h1>Terms of Service</h1>
        <p className="hero-copy">
          These terms cover your use of the Medina Clean website and its booking tools — including estimates
          and appointment requests made on the site or from an AI assistant. By using them you agree to these
          terms. Medina Clean is operated by Northvalley Intelligence LLC on behalf of Rosa Medina.
        </p>
        <div className="faq">
          <details open>
            <summary>Appointment requests are requests, not confirmed bookings</summary>
            <p>
              Submitting an appointment request — on the website or through an AI assistant — sends the details to
              Rosa for review. It does not confirm or guarantee an appointment. Rosa reviews the address, timing,
              and property and contacts you to confirm the schedule and final price. No appointment exists until
              Rosa confirms it directly.
            </p>
          </details>
          <details open>
            <summary>Estimates and pricing</summary>
            <p>
              Prices shown are <strong>starting estimates</strong> based on the information you provide, not final
              quotes. The final price is confirmed by Rosa after reviewing the property and scope. Assumptions such
              as standard cleaning materials, property condition, buildup, pets, and move-out cleaning may change the
              final price. Some services (for example small-business or post-construction cleaning) are estimated
              onsite and are not auto-quoted.
            </p>
          </details>
          <details open>
            <summary>Service area</summary>
            <p>
              Service-area checks are approximate (about 20 miles of ZIP 30188) and do not guarantee availability.
              Rosa confirms whether she can service a specific address before accepting a request.
            </p>
          </details>
          <details open>
            <summary>Acceptable use</summary>
            <p>
              Use the site and its tools only to request cleaning services in good faith. Do not submit false
              information, use the request tools to send spam or abusive volume, or attempt to disrupt the service.
              We may decline or remove requests that appear abusive or automated.
            </p>
          </details>
          <details open>
            <summary>AI assistant access</summary>
            <p>
              Medina Clean offers a Model Context Protocol (MCP) connector so you can check the service area, get an
              estimate, and send an appointment request from a compatible AI assistant. The same terms apply: the
              assistant sends a request only; Rosa confirms every appointment.
            </p>
          </details>
          <details open>
            <summary>No warranty &amp; limitation of liability</summary>
            <p>
              The website, estimates, and booking tools are provided &quot;as is,&quot; without warranties of any
              kind. Estimates and availability may be inaccurate or unavailable at times. To the extent permitted by
              law, Medina Clean and Northvalley Intelligence LLC are not liable for indirect or consequential damages
              arising from use of the site or tools. Nothing here limits rights that cannot be limited under
              applicable law.
            </p>
          </details>
          <details open>
            <summary>Changes, governing law &amp; contact</summary>
            <p>
              We may update these terms; continued use means you accept the updated terms. These terms are governed
              by the laws of the State of Georgia, USA. For questions, contact Medina Clean at (470) 781-4143 or
              Northvalley Intelligence LLC at contact@northvalleyintel.com. See also our{" "}
              <a href="/privacy">privacy policy</a>.
            </p>
          </details>
        </div>
        <p className="note">Built by Northvalley Intelligence LLC.</p>
      </div>
    </main>
  );
}
