// components/AuthWrapper.tsx
import { useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2a2pmemppa2Z1cWRwbW9tZGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4OTE2NTcsImV4cCI6MjA2NDQ2NzY1N30.sVejmzInkxXnGxjm5rowJKuwTuVrcJ40Ix3Dk1W3ogE";

const supabase = createClient('https://vvkjfzjikfuqdpmomdbx.supabase.co', API_KEY);

interface AuthWrapperProps {
  children: (session: any) => ReactNode;
}

export const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-semibold mb-6 text-center">Vendor Management</h1>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            redirectTo={window.location.origin}
          />
        </div>
      </div>
    );
  }

  return <>{children(session)}</>;
};