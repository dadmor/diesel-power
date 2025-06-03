// ===== src/components/shared/index.tsx =====
import React from 'react';
import { LucideIcon } from 'lucide-react';

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  icon: Icon,
  loading,
  children,
  className = '',
  ...props 
}) => {
  const baseClass = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50';
  
  const variants = {
    primary: 'bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-500',
    secondary: 'bg-white/60 hover:bg-white/80 text-slate-700 border border-slate-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-sm'
  };

  return (
    <button 
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : Icon ? (
        <Icon className="h-4 w-4 mr-2" />
      ) : null}
      {children}
    </button>
  );
};

// Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', header }) => (
  <div className={`bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm ${className}`}>
    {header && (
      <div className="px-8 py-6 border-b border-slate-200/60">
        {header}
      </div>
    )}
    <div className="p-8">
      {children}
    </div>
  </div>
);

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
    <input
      className={`w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm transition-all duration-200 ${error ? 'border-red-300' : ''} ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, error, options, className = '', ...props }) => (
  <div>
    {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
    <select
      className={`w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm transition-all duration-200 ${error ? 'border-red-300' : ''} ${className}`}
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

// Layout Component
interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onBack?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, subtitle, actions, onBack }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <header className="bg-white/70 backdrop-blur-sm border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {onBack && (
              <button onClick={onBack} className="text-slate-600 hover:text-slate-900 transition-colors duration-200">
                ← Powrót
              </button>
            )}
            <div>
              <h1 className="text-3xl font-light tracking-tight text-slate-900">{title}</h1>
              {subtitle && <p className="text-slate-600 text-sm">{subtitle}</p>}
            </div>
          </div>
          {actions}
        </div>
      </div>
    </header>
    <div className="max-w-7xl mx-auto p-8">
      {children}
    </div>
  </div>
);

// Loading Component
export const Loading = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900" />
  </div>
);

// Empty State Component
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => (
  <div className="text-center py-16">
    <Icon className="h-16 w-16 text-slate-400 mx-auto mb-6 opacity-60" />
    <h3 className="text-xl font-light text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 mb-8 text-sm">{description}</p>
    {action}
  </div>
);