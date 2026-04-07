export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center py-20 lg:py-32">
        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6">
          Find the Best <span className="text-primary-500">Discounts</span> in Your City
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto">
          SalesHub brings you the most exclusive offers and premium deals right to your fingertips.
        </p>
        <div className="flex justify-center gap-4">
          <button className="btn-primary px-8 py-4 text-lg">
            Explore Offers
          </button>
          <button className="btn-secondary px-8 py-4 text-lg">
            Select Your City
          </button>
        </div>
      </div>

      {/* Feature Section Placeholder */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-8 h-64 flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-4">
              <span className="text-primary-600 dark:text-primary-300 font-bold">{i}</span>
            </div>
            <h3 className="font-bold text-xl mb-2">Premium Offer {i}</h3>
            <p className="text-zinc-500 dark:text-zinc-400">Exclusive discount available only on SalesHub.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
