import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy — The Archive',
  description: 'Privacy policy for The Archive music curation ecosystem.',
};

export default function PrivacyPage() {
  return (
    <main>
      <header className="masthead">
        <Link className="wordmark" href="/" aria-label="The Archive home">
          <span>THE</span> ARCHIVE
        </Link>
        <div className="mast-meta">
          <span>INDEPENDENT TRANSMISSIONS</span>
        </div>
      </header>

      <section className="privacy-page">
        <div className="section-heading">
          <h1>PRIVACY<br />NOTICE</h1>
        </div>

        <div className="privacy-content">
          <h2>Data Collection</h2>
          <p>
            The Archive uses an anonymous identifier stored in your browser to enable ratings, tags, and play counting. 
            This identifier is a random UUID that does not contain any personal information about you.
          </p>

          <h2>What We Collect</h2>
          <ul>
            <li><strong>Anonymous User ID:</strong> A random UUID generated in your browser to distinguish your interactions from others</li>
            <li><strong>Ratings:</strong> Your 1–5 star ratings for individual tracks</li>
            <li><strong>Tags:</strong> Tags you submit for tracks (held for moderation before public display)</li>
            <li><strong>Play Events:</strong> Qualified playback events (30+ seconds or 50%+ of short tracks)</li>
            <li><strong>Campaign Parameters:</strong> UTM parameters from QR codes or links for attribution</li>
          </ul>

          <h2>What We Don&apos;t Collect</h2>
          <ul>
            <li>Your name, email address, or any personal identity information</li>
            <li>Your IP address in The Archive application database (Cloudflare may process request metadata to operate and secure its network)</li>
            <li>Your location</li>
            <li>Your device fingerprint</li>
            <li>Browser fingerprinting or tracking cookies from third parties</li>
          </ul>

          <h2>How Data Is Used</h2>
          <p>
            Your anonymous ID is used solely to:
          </p>
          <ul>
            <li>Prevent duplicate ratings and tag submissions from the same browser</li>
            <li>Display your own ratings back to you</li>
            <li>Count qualified plays for analytics (deduplicated per track per hour)</li>
            <li>Attribute engagement to campaigns when you arrive via QR code</li>
          </ul>

          <h2>Data Retention</h2>
          <ul>
            <li><strong>Ratings and Tags:</strong> Retained indefinitely as part of the archive</li>
            <li><strong>Raw Play Events:</strong> Retained for 90 days, then aggregated or deleted</li>
            <li><strong>Rejected Tags:</strong> Retained for 30 days for abuse prevention</li>
            <li><strong>Publishing Audit Records:</strong> Retained indefinitely</li>
          </ul>

          <h2>Public Visibility</h2>
          <p>
            Your anonymous user ID is never exposed in public API responses. Aggregate ratings and play counts 
            are shown only after a minimum sample size (initially 5 ratings). Your individual ratings and 
            tags are not publicly linked to your identity.
          </p>

          <h2>Third-Party Services</h2>
          <p>
            The Archive is built on Cloudflare infrastructure and uses:
          </p>
          <ul>
            <li><strong>Cloudflare D1:</strong> Database storage</li>
            <li><strong>Cloudflare R2:</strong> Audio and artwork storage</li>
            <li><strong>Cloudflare Pages:</strong> Web hosting</li>
          </ul>
          <p>
            These services are used solely to deliver the archive. No advertising trackers or analytics 
            services are integrated.
          </p>

          <h2>Your Control</h2>
          <p>
            Because the archive uses anonymous browser storage rather than accounts:
          </p>
          <ul>
            <li>Clearing your browser data will remove your anonymous ID</li>
            <li>This may allow you to submit new ratings for the same tracks</li>
            <li>Your previous ratings will remain in the archive but will no longer be associated with your browser</li>
            <li>Without the anonymous identifier, a previous interaction cannot reliably be matched back to your browser</li>
          </ul>

          <h2>Contact</h2>
          <p>
            For privacy inquiries or data deletion requests, contact the curator through the channels 
            provided on this site.
          </p>

          <p className="privacy-updated">
            Last updated: July 2026
          </p>
        </div>
      </section>

      <footer>
        <div className="footer-brand">THE<br /><span>ARCHIVE</span></div>
        <p>Five evolving bodies of work.<br />One independent signal.</p>
      </footer>
    </main>
  );
}
