// src/vendor_app/components/SignUpForm.tsx
import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/themes/default/components/Button'
import { Input } from '@/themes/default/components/Form'


interface SignUpFormProps {
  onToggleMode: () => void
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onToggleMode }) => {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Wszystkie pola są wymagane')
      return
    }

    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne')
      return
    }

    if (password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków')
      return
    }

    setLoading(true)
    setError(null)

    const { error: authError } = await signUp(email, password)
    
    if (authError) {
      setError(authError.message)
    } else {
      setSuccess(true)
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">
            Konto zostało utworzone! Sprawdź swoją skrzynkę email, aby potwierdzić rejestrację.
          </div>
          <Button onClick={onToggleMode} variant="primary">
            Przejdź do logowania
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Rejestracja</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          placeholder="twoj@email.com"
        />
        
        <Input
          label="Hasło"
          value={password}
          onChange={setPassword}
          type="password"
          placeholder="Wprowadź hasło (min. 6 znaków)"
        />

        <Input
          label="Potwierdź hasło"
          value={confirmPassword}
          onChange={setConfirmPassword}
          type="password"
          placeholder="Powtórz hasło"
        />

        <Button
          type="submit"
          disabled={loading}
          variant="primary"
        >
          {loading ? 'Rejestracja...' : 'Zarejestruj się'}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-gray-600">
          Masz już konto?{' '}
          <button
            onClick={onToggleMode}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Zaloguj się
          </button>
        </p>
      </div>
    </div>
  )
}