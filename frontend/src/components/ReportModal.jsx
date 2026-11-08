import { useEffect, useState } from 'react';
import { createReport, fetchReportTypes } from '../services/api';

export default function ReportModal({ open, onClose, coords, onSuccess }) {
  const [types, setTypes] = useState([]);
  const [categoryCode, setCategoryCode] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    setError('');
    setDescription('');
    fetchReportTypes()
      .then((data) => {
        setTypes(data);
        if (data.length > 0) {
          setCategoryCode(data[0].code);
        }
      })
      .catch((err) => setError(err.message));
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !coords) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createReport({
        category_code: categoryCode,
        latitude: coords.lat,
        longitude: coords.lon,
        description: description.trim() || null,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />

        <header className="sheet-header">
          <div>
            <p className="sheet-kicker">Novo relato</p>
            <h2 id="sheet-title">Registrar alerta</h2>
          </div>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="sheet-form">
          <label className="field">
            <span>Categoria</span>
            <select
              value={categoryCode}
              onChange={(e) => setCategoryCode(e.target.value)}
              required
            >
              {types.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Descrição (opcional)</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que está acontecendo?"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="sheet-submit" disabled={loading || !categoryCode}>
            {loading ? 'Enviando…' : 'Enviar alerta'}
          </button>
        </form>
      </div>
    </div>
  );
}
