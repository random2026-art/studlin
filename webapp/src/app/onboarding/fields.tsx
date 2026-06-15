'use client'

import { useState } from 'react'
import { Ic } from './icons'

interface TextFieldProps {
  label: string
  value?: string
  onChange: (value: string) => void
  type?: string
  hint?: string | null
  error?: string | null
  autoFocus?: boolean
  autoComplete?: string
}

export function TextField({ label, value, onChange, type = 'text', hint, error, autoFocus, autoComplete }: TextFieldProps) {
  const [focused, setFocused] = useState(false)
  const [show, setShow] = useState(false)
  const isPw = type === 'password'
  const inputType = isPw && show ? 'text' : type
  const hasValue = !!(value && String(value).length)

  return (
    <div className="field">
      <div className={'input-wrap' + (hasValue ? ' has-value' : '') + (focused ? ' is-focused' : '') + (error ? ' has-error' : '')}>
        <label>{label}</label>
        <input
          type={inputType}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus={autoFocus}
          autoComplete={autoComplete || 'off'}
        />
        {isPw && (
          <button type="button" className="pwd-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? Ic.eyeOff : Ic.eye}
          </button>
        )}
      </div>
      {error && <div className="field-error"><strong>Required field</strong> · {error}</div>}
      {!error && hint && <div className="field-hint">{hint}</div>}
    </div>
  )
}

interface SelectFieldProps {
  label: string
  value?: string
  onChange: (value: string) => void
  options: string[]
  hint?: string
}

export function SelectField({ label, value, onChange, options, hint }: SelectFieldProps) {
  const [focused, setFocused] = useState(false)
  const hasValue = !!value

  return (
    <div className="field">
      <div className={'input-wrap' + (hasValue ? ' has-value' : '') + (focused ? ' is-focused' : '')}>
        <label>{label}</label>
        <select value={value || ''} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
          <option value="" disabled hidden></option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <span className="chev">{Ic.chev}</span>
      </div>
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  )
}
