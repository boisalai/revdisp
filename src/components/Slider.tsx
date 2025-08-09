interface SliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  formatter?: (value: number) => string
  disabled?: boolean
}

export default function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  formatter = (v) => v.toString(),
  disabled = false
}: SliderProps) {
  return (
    <div className="govuk-form-group">
      <div className="flex justify-between items-center mb-2">
        <label className="govuk-label">
          {label}
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="govuk-input w-24"
        />
      </div>
      <div className="relative">
        <input
          type="range"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full h-2 bg-govuk-mid-grey appearance-none rounded-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-govuk-yellow focus:ring-offset-2"
          style={{
            background: `linear-gradient(to right, #1d70b8 0%, #1d70b8 ${((value - min) / (max - min)) * 100}%, #b1b4b6 ${((value - min) / (max - min)) * 100}%, #b1b4b6 100%)`
          }}
        />
        <div className="flex justify-between text-sm text-govuk-dark-grey mt-1">
          <span>{formatter(min)}</span>
          <span>{formatter(max)}</span>
        </div>
      </div>
    </div>
  )
}