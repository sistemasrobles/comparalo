'use client';

import { useState, FormEvent } from 'react';
import { api } from '@/lib/api';

interface LeadFormProps {
  projectId: string;
  projectName: string;
  lotId?: string;
  onSuccess?: () => void;
}

export function LeadForm({ projectId, projectName, lotId, onSuccess }: LeadFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    paymentMethod: 'CASH',
    timeline: 'EXPLORING',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.submitLead({
        ...formData,
        projectId,
        lotId,
      });
      setSuccess(true);
      onSuccess?.();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : null) || 'Error al enviar tu consulta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Consulta enviada!</h3>
        <p className="text-gray-600 text-sm">
          Un asesor de {projectName} te contactará pronto. Revisa tu email y WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Solicitar información
      </h3>
      <p className="text-sm text-gray-500">
        Recibe asesoría gratuita sobre {projectName}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
        <input
          type="text"
          required
          className="input-field"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          placeholder="Juan Pérez"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input
          type="email"
          required
          className="input-field"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="juan@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
        <input
          type="tel"
          required
          className="input-field"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="999 888 777"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Forma de pago</label>
        <select
          className="input-field"
          value={formData.paymentMethod}
          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
        >
          <option value="CASH">Contado</option>
          <option value="FINANCING">Financiamiento</option>
          <option value="BANK_CREDIT">Crédito hipotecario</option>
          <option value="MIXED">Mixto</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuándo planeas comprar?</label>
        <select
          className="input-field"
          value={formData.timeline}
          onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
        >
          <option value="EXPLORING">Solo explorando</option>
          <option value="THREE_MONTHS">Dentro de 3 meses</option>
          <option value="SIX_MONTHS">Dentro de 6 meses</option>
          <option value="IMMEDIATE">Compra inmediata</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje (opcional)</label>
        <textarea
          className="input-field"
          rows={3}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="¿Alguna pregunta específica?"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Enviando...' : 'Solicitar información gratuita'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Al enviar, aceptas nuestros términos de uso y política de privacidad.
      </p>
    </form>
  );
}
