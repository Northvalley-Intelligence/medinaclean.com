import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Medina Clean appointment requests and reviews."
};

export default function PrivacyPage() {
  return (
    <main className="section">
      <div className="section-inner">
        <p className="eyebrow">Privacy</p>
        <h1>Privacy Policy</h1>
        <p className="hero-copy">
          Medina Clean collects only the information needed to respond to cleaning requests, review service area
          availability, and moderate client reviews.
        </p>
        <div className="faq">
          <details open>
            <summary>Information collected</summary>
            <p>Name, phone number, address, service details, preferred appointment times, review text, and optional review photo.</p>
          </details>
          <details open>
            <summary>How information is used</summary>
            <p>Appointment information is used to contact the client and review service availability. Reviews are shown publicly only after approval and consent.</p>
          </details>
          <details open>
            <summary>Google user data</summary>
            <p>
              The Medina Clean operations app can connect to Google services on Rosa Medina&apos;s own account. When
              connected, it requests Google Calendar access to create and update appointment calendar events and send
              scheduling invites for cleanings Rosa accepts, and YouTube upload access so Rosa can publish her own Medina
              Clean project videos to her YouTube channel from the private admin app. Google user data is used only to
              provide these features, is not sold, and is not shared with third parties except the Google APIs that
              provide the feature. Medina Clean&apos;s use of information received from Google APIs adheres to the Google
              API Services User Data Policy, including the Limited Use requirements.
            </p>
          </details>
          <details open>
            <summary>Who receives the data</summary>
            <p>
              Data is not sold. It is shared only with the service providers that operate the website and its
              booking flow: Rosa Medina (the business owner, who receives appointment requests), the database and
              hosting providers, and the email provider used to notify Rosa of a request. Appointment requests
              submitted from an AI assistant (via the Medina Clean MCP connector) follow the same path. No advertising
              networks or data brokers are involved.
            </p>
          </details>
          <details open>
            <summary>Data retention</summary>
            <p>
              Appointment requests are kept only as long as needed to respond to and service the request, and are
              removed on request. Reviews are kept until the client asks to remove them. Low-resolution review photos
              are stored only for approved, consented reviews and deleted when a review is removed.
            </p>
          </details>
          <details open>
            <summary>Deletion requests &amp; contact</summary>
            <p>
              Clients may ask Rosa to remove appointment information or an approved review at any time. For any
              privacy request or question, contact Medina Clean at (470) 781-4143, or Northvalley Intelligence LLC at
              contact@northvalleyintel.com.
            </p>
          </details>
        </div>
      </div>
    </main>
  );
}
