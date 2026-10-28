// Labelled inputs for the Tabù admin forms

interface FieldProps {
  label: string
  name: string
  defaultValue?: string | number | null
  type?: string
  required?: boolean
  hint?: string
  className?: string
}

export function Field({ label, name, defaultValue, type = 'text', required, hint, className = '' }: FieldProps) {
  return (
    <label className={`fieldset ${className}`}>
      <span className="fieldset-legend">{label}</span>
      <input name={name} type={type} required={required} defaultValue={defaultValue ?? ''} className="input w-full" />
      {hint && <span className="label whitespace-normal">{hint}</span>}
    </label>
  )
}

export function TextArea({ label, name, defaultValue, hint, className = '' }: Omit<FieldProps, 'type' | 'required'>) {
  return (
    <label className={`fieldset ${className}`}>
      <span className="fieldset-legend">{label}</span>
      <textarea name={name} defaultValue={defaultValue ?? ''} className="textarea w-full" />
      {hint && <span className="label whitespace-normal">{hint}</span>}
    </label>
  )
}

export function Checkbox({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="label cursor-pointer gap-2">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="checkbox checkbox-sm checkbox-primary" />
      <span>{label}</span>
    </label>
  )
}
