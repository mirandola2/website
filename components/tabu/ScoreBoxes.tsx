// Read-only self-check: five boxes like the paper template, the first `value` filled
export default function ScoreBoxes({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span>{label}</span>
      <span className="flex gap-0.5" role="img" aria-label={value ? `${value} su 5` : 'non ancora'}>
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={`size-3.5 rounded-sm border border-primary ${i <= value ? 'bg-primary' : ''}`} />
        ))}
      </span>
    </div>
  )
}
