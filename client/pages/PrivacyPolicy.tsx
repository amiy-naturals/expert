export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-muted-foreground mb-6">Last updated: {new Date().getFullYear()}</p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
        <p className="mb-4">
          Amiy Experts ("we", "our", or "us") operates the application (the "Service"). This page informs you of our
          policies regarding the collection, use, and disclosure of personal data when you use our Service and the
          choices you have associated with that data.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Information Collection and Use</h2>
        <p className="mb-4">We collect information for various purposes to provide and improve our Service:</p>
        <ul className="list-disc list-inside mb-4 space-y-2">
          <li>Email address for account creation and authentication</li>
          <li>Name and profile information</li>
          <li>Profile picture from authentication providers</li>
          <li>Professional credentials and medical license information</li>
          <li>Usage data and analytics</li>
          <li>Payment and transaction information</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Use of Data</h2>
        <p className="mb-4">Amiy Experts uses the collected data for various purposes:</p>
        <ul className="list-disc list-inside mb-4 space-y-2">
          <li>To provide and maintain our Service</li>
          <li>To notify you about changes to our Service</li>
          <li>To allow you to participate in interactive features of our Service</li>
          <li>To provide customer support</li>
          <li>To gather analysis or valuable information so that we can improve our Service</li>
          <li>To monitor the usage of our Service</li>
          <li>To detect, prevent and address technical and security issues</li>
          <li>To verify professional credentials and qualifications</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Google OAuth Authentication</h2>
        <p className="mb-4">
          When you sign in using Google OAuth, we receive the following information from Google:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-2">
          <li>Email address (verified by Google)</li>
          <li>Full name</li>
          <li>Profile picture</li>
          <li>Unique Google user ID</li>
        </ul>
        <p className="mb-4">
          Google's use of information received from Google APIs will adhere to
          <a href="https://policies.google.com/privacy" className="underline ml-1" target="_blank" rel="noopener noreferrer">
            Google API Services User Data Policy
          </a>
          , including the limited use requirements.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Security of Data</h2>
        <p className="mb-4">
          The security of your data is important to us but remember that no method of transmission over the Internet or
          method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect
          your personal data, we cannot guarantee its absolute security.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Changes to This Privacy Policy</h2>
        <p className="mb-4">
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
          Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
        <p className="mb-4">
          If you have any questions about this Privacy Policy, please contact us at support@amiyexperts.com
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">8. Legal Compliance</h2>
        <p className="mb-4">
          This Privacy Policy is designed to comply with applicable privacy laws and regulations, including but not
          limited to GDPR, CCPA, and other international privacy standards.
        </p>
      </section>
    </div>
  );
}
