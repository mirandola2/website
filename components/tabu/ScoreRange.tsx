'use client'

import { useState } from 'react'

// 0–5 self-check slider (the five boxes of the paper template); 0 = not checked yet
export default function ScoreRange({ name, label, defaultValue }: { name: string; label: string; defaultValue: number }) {
  const [value, setValue] = useState(defaultValue)

  return (
    <label className="block">
      <span className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-bold">{value ? `${value}/5` : '—'}</span>
      </span>
      <input
        type="range"
        name={name}
        min={0}
        max={5}
        step={1}
        value={value}
        onChange={e => setValue(Number(e.target.value))}
        className="range range-primary range-xs w-full"
      />
      <span className="flex justify-between px-1 text-xs opacity-50" aria-hidden>
        <span>–</span>
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
      </span>
    </label>
  )
}
