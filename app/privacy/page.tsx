export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Privacy Policy</h1>
        <div className="space-y-6 text-gray-300">
          <section className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">1. Information We Collect</h2>
            <p>We collect personal information including name, email, and payment details to provide our services.</p>
          </section>

          <section className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">2. How We Use Your Information</h2>
            <p>We use your information to process transactions, provide customer support, and improve our services.</p>
          </section>

          <section className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">3. Data Security</h2>
            <p>We use industry-standard encryption and security measures to protect your personal information.</p>
          </section>

          <section className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">4. Cookies</h2>
            <p>We use cookies to enhance your browsing experience and analyze site traffic.</p>
          </section>

          <section className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">5. Sharing Your Information</h2>
            <p>We do not sell your personal information. We may share it with trusted partners to provide our services.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
