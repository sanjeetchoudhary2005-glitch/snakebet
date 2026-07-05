export default function ResponsibleGaming() {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Responsible Gaming</h1>
        <div className="space-y-6 text-gray-300">
          <section className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Gamble Responsibly</h2>
            <p>Gaming should be fun and entertaining, not a way to make money. Never gamble with money you can't afford to lose.</p>
          </section>

          <section className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Set Limits</h2>
            <p>Take advantage of our deposit, wagering, and loss limits to keep your gaming in control.</p>
          </section>

          <section className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Self-Exclusion</h2>
            <p>If you need a break, contact us to request self-exclusion for a period of time that works for you.</p>
          </section>

          <section className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Warning Signs</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Gambling to escape problems or negative emotions</li>
              <li>Lying about how much you gamble</li>
              <li>Borrowing money to gamble</li>
              <li>Neglecting work, family, or responsibilities</li>
            </ul>
          </section>

          <section className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Get Help</h2>
            <p>If you or someone you know has a gambling problem, please seek help from professional organizations.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
