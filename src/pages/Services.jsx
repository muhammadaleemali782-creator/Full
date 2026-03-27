import { useStore } from "../context/StoreContext"

export default function Services() {
  const { blocks } = useStore()

  const servicesBlocks = (blocks || []).filter(
    b => b.page === "services"
  )

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {servicesBlocks.length === 0 && (
        <div className="bg-white p-6 rounded shadow text-center col-span-3">
          <h2 className="font-bold text-xl">No Services Added</h2>
        </div>
      )}

      {servicesBlocks.map(b => (
        <div
          key={b.id}
          className={`bg-white p-5 rounded shadow hover:scale-105 transition
          ${b.type === "square" ? "aspect-square" : "aspect-video"}`}
        >
          <h3 className="font-bold mb-2">{b.title}</h3>
          <p className="text-gray-600">{b.desc}</p>
        </div>
      ))}
    </div>
  )
}
