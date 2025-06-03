// ===== src/components/AutoForm.tsx =====
import React from 'react';
import { Field } from '../types';
import { Button, Input, Select } from './shared';
import { useForm } from '../hooks';

interface AutoFormProps {
  fields: Field[];
  initialValues?: any;
  onSubmit: (values: any) => Promise<void>;
  onCancel?: () => void;
  submitText?: string;
  loading?: boolean;
}

export const AutoForm: React.FC<AutoFormProps> = ({
  fields,
  initialValues = {},
  onSubmit,
  onCancel,
  submitText = 'Zapisz',
  loading = false
}) => {
  const { values, errors, setValue, setFieldTouched, validate } = useForm(initialValues);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate(fields)) {
      await onSubmit(values);
    }
  };

  const renderField = (field: Field) => {
    const commonProps = {
      label: field.name,
      value: values[field.name] || '',
      onChange: (e: any) => setValue(field.name, e.target.value),
      onBlur: () => setFieldTouched(field.name),
      error: errors[field.name],
      required: field.required
    };

    switch (field.type) {
      case 'select':
        return (
          <Select
            {...commonProps}
            options={[
              { value: '', label: 'Wybierz...' },
              ...(field.options || []).map(opt => ({ value: opt, label: opt }))
            ]}
          />
        );
      
      case 'text':
        return (
          <div>
            {commonProps.label && (
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {commonProps.label}
              </label>
            )}
            <textarea
              value={commonProps.value}
              onChange={commonProps.onChange}
              onBlur={commonProps.onBlur}
              required={commonProps.required}
              className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm transition-all duration-200"
              rows={3}
            />
            {commonProps.error && (
              <p className="mt-1 text-sm text-red-600">{commonProps.error}</p>
            )}
          </div>
        );
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={values[field.name] || false}
              onChange={(e) => setValue(field.name, e.target.checked)}
              className="rounded border-slate-200 text-slate-900 focus:ring-slate-900"
            />
            <label className="text-sm font-medium text-slate-700">{field.name}</label>
          </div>
        );
      
      default:
        return (
          <Input
            {...commonProps}
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            onChange={(e) => setValue(field.name, 
              field.type === 'number' ? Number(e.target.value) : e.target.value
            )}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map(field => (
        <div key={field.name}>
          {renderField(field)}
        </div>
      ))}
      
      <div className="flex space-x-4 pt-4">
        <Button type="submit" loading={loading}>
          {submitText}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Anuluj
          </Button>
        )}
      </div>
    </form>
  );
};