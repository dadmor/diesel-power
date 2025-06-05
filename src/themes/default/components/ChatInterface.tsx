// src/themes/default/components/ChatInterface.tsx
import React from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  description?: string;
  loading?: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Wpisz wiadomość...",
  description,
  loading = false,
  disabled = false
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="p-4 border-t bg-gray-50">
      <div className="flex space-x-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading || disabled}
        />
        <button
          onClick={onSubmit}
          disabled={loading || !value.trim() || disabled}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? "..." : "Wyślij"}
        </button>
      </div>
      {description && (
        <div className="mt-2 text-xs text-gray-500">
          {description}
        </div>
      )}
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = "" 
}) => {
  const sizeClasses = {
    sm: 'h-3 w-3 border-2',
    md: 'h-4 w-4 border-2', 
    lg: 'h-6 w-6 border-3'
  };

  return (
    <div className={`animate-spin ${sizeClasses[size]} border-blue-500 border-t-transparent rounded-full ${className}`}></div>
  );
};

interface ChatContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border flex-1 flex flex-col ${className}`}>
      {children}
    </div>
  );
};

interface ChatHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`px-4 py-3 border-b ${className}`}>
      {children}
    </div>
  );
};