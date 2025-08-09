import CompactCalculator from '../components/CompactCalculator'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        {/* Compact Calculator Component */}
        <CompactCalculator />
      </div>
    </main>
  )
}