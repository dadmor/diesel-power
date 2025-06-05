// src/vendor_app/components/LoginForm.tsx
import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button, Input } from '../../themes/default'

interface LoginFormProps {
  onToggleMode: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Oba pola są wymagane')
      return
    }

    setLoading(true)
    setError(null)

    const { error: authError } = await signIn(email, password)
    
    if (authError) {
      setError(authError.message)
    }
    
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Logowanie</h2>
      
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
          placeholder="Wprowadź hasło"
        />

        <Button
          type="submit"
          disabled={loading}
          variant="primary"
        >
          {loading ? 'Logowanie...' : 'Zaloguj się'}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-gray-600">
          Nie masz konta?{' '}
          <button
            onClick={onToggleMode}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Zarejestruj się
          </button>
        </p>
      </div>
    </div>
  )
}
