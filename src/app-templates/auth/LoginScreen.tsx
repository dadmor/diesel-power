// src/app-templates/auth/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import { Vendor } from '../../vendor_apps';

interface LoginScreenProps {
  vendor: Vendor;
  onLogin: (user: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ vendor, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mockUsers, setMockUsers] = useState<any[]>([]);

  useEffect(() => {
    // Generuj przykładowych użytkowników na podstawie schematu
    generateMockUsers();
  }, [vendor]);

  const generateMockUsers = () => {
    const usersTable = vendor.schema.tables?.find((t: any) => t.name === 'users');
    if (!usersTable) {
      // Jeśli nie ma tabeli users, stwórz podstawowego użytkownika
      setMockUsers([
        { id: 1, email: 'admin@test.pl', full_name: 'Administrator', role: 'admin', password: 'admin123' }
      ]);
      return;
    }

    // Sprawdź jakie role są dostępne
    const roleColumn = usersTable.columns?.find((col: any) => col.name === 'role');
    const availableRoles = roleColumn?.enum || ['admin', 'user'];

    const users = availableRoles.map((role: string, index: number) => ({
      id: index + 1,
      email: `${role}@${vendor.slug}.pl`,
      full_name: `${role.charAt(0).toUpperCase() + role.slice(1)} ${vendor.name}`,
      role: role,
      password: `${role}123`,
      active: true
    }));

    setMockUsers(users);
  };

  const handleLogin = () => {
    if (!email || !password) {
      setError('Proszę wypełnić wszystkie pola');
      return;
    }

    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      onLogin(user);
    } else {
      setError('Nieprawidłowy email lub hasło');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{vendor.name}</h1>
          <p className="text-gray-600">Zaloguj się do systemu</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Wpisz swój email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hasło
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Wpisz swoje hasło"
            />
          </div>
          
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Zaloguj się
          </button>
        </div>

        {mockUsers.length > 0 && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-3 font-medium">Dostępne konta testowe:</p>
            <div className="space-y-2">
              {mockUsers.map(user => (
                <div key={user.id} className="text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{user.role}:</span>
                    <button
                      onClick={() => {
                        setEmail(user.email);
                        setPassword(user.password);
                        setError('');
                      }}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Użyj
                    </button>
                  </div>
                  <div className="text-gray-500">
                    {user.email} / {user.password}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Kliknij "Użyj" aby automatycznie wypełnić dane logowania
            </div>
          </div>
        )}
      </div>
    </div>
  );
};