import { Disclaimer } from "@/components/Disclaimer";

const samplePlan = [
  {
    day: "Monday",
    meals: [
      { name: "Oatmeal with banana", cost: 0.9 },
      { name: "Bean & rice burrito", cost: 1.2 },
      { name: "Sheet-pan chicken with potatoes", cost: 3.4 },
    ],
  },
  {
    day: "Tuesday",
    meals: [
      { name: "Eggs and toast", cost: 0.8 },
      { name: "Tuna salad sandwich", cost: 1.4 },
      { name: "Pasta with frozen veg & sausage", cost: 2.9 },
    ],
  },
  {
    day: "Wednesday",
    meals: [
      { name: "Yogurt with oats", cost: 0.9 },
      { name: "Lentil soup", cost: 1.2 },
      { name: "Chicken stir-fry with rice", cost: 3.2 },
    ],
  },
];

const groceries = [
  { item: "Eggs (1 dozen)", cost: 2.8, eligible: true },
  { item: "Whole oats (2 lb)", cost: 3.2, eligible: true },
  { item: "Bananas (per lb)", cost: 0.6, eligible: true },
  { item: "Brown rice (5 lb)", cost: 4.5, eligible: true },
  { item: "Dried beans (2 lb)", cost: 2.4, eligible: true },
  { item: "Chicken thighs (family pack)", cost: 7.8, eligible: true },
  { item: "Frozen mixed vegetables", cost: 2.6, eligible: true },
  { item: "Canned tuna (4-pack)", cost: 3.9, eligible: true },
  { item: "Whole-wheat tortillas (10 ct)", cost: 2.5, eligible: true },
  { item: "Greek yogurt (32 oz)", cost: 3.6, eligible: true },
  { item: "Hot prepared deli food", cost: 0, eligible: false },
  { item: "Soap and household paper goods", cost: 0, eligible: false },
];

export default function GroceryPlanPage() {
  const totalCost = groceries.filter((g) => g.eligible).reduce((s, g) => s + g.cost, 0);
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Grocery plan</h1>
        <p className="text-sm text-gray-600">A sample week of low-cost, SNAP-eligible meals for a household of three.</p>
      </header>
      <Disclaimer variant="compact" />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card card-pad">
          <h2 className="font-semibold">Sample meals</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {samplePlan.map((d) => (
              <li key={d.day}>
                <div className="font-medium">{d.day}</div>
                <ul className="mt-1 list-disc pl-5 text-gray-700">
                  {d.meals.map((m) => (
                    <li key={m.name}>{m.name} <span className="text-gray-500">— ~${m.cost.toFixed(2)}/person</span></li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
        <div className="card card-pad">
          <h2 className="font-semibold">Sample grocery list</h2>
          <table className="mt-3 w-full text-sm">
            <thead className="text-gray-500 text-xs">
              <tr><th className="text-left">Item</th><th className="text-right">Approx. cost</th><th className="text-right">SNAP-eligible</th></tr>
            </thead>
            <tbody>
              {groceries.map((g) => (
                <tr key={g.item} className="border-t border-gray-100">
                  <td className="py-1">{g.item}</td>
                  <td className="py-1 text-right">{g.eligible ? `$${g.cost.toFixed(2)}` : "—"}</td>
                  <td className="py-1 text-right">
                    {g.eligible ? <span className="badge-green">Yes</span> : <span className="badge-gray">No</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 font-medium">
                <td className="py-2">Eligible total</td>
                <td className="py-2 text-right">${totalCost.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="card card-pad bg-brand-50 border-brand-200">
        <h3 className="font-semibold">Food resources in your county</h3>
        <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Local food pantry — placeholder, populated per county during pilot.</li>
          <li>WIC — for pregnant individuals, infants, and children under five.</li>
          <li>Summer EBT for school-age children.</li>
          <li>Farmers' market double-up programs (state-dependent).</li>
        </ul>
      </div>
    </div>
  );
}
