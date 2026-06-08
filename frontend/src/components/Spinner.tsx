export default function Spinner() {
  return (
    <div className="fixed inset-0 bg-gray-950/80 flex flex-col items-center justify-center z-50">
      <div className="w-12 h-12 border-4 border-gray-700 border-t-orange-500 rounded-full animate-spin mb-4" />
      <p className="text-gray-400 text-sm">Curating your playlist…</p>
    </div>
  )
}
