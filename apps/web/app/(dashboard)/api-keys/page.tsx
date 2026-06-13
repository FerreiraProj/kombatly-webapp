'use client';

import { useEffect, useState } from 'react';
import { Key, Plus, Trash2, Copy, Check, Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<ApiKey[]>('/api-keys')
      .then((r) => setKeys(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function createKey() {
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    try {
      const { data } = await apiClient.post<ApiKey & { key: string }>('/api-keys', { name: newName.trim() });
      setCreatedKey(data.key);
      setKeys((prev) => [...prev, { id: data.id, name: data.name, prefix: data.prefix, createdAt: data.createdAt }]);
      setNewName('');
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Erro ao criar chave.');
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    setRevoking(id);
    try {
      await apiClient.delete(`/api-keys/${id}`);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {
      /* ignore */
    } finally {
      setRevoking(null);
    }
  }

  function copyKey() {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function fmt(iso?: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Integrações</p>
        <h1 className="font-heading text-4xl text-foreground sm:text-5xl">API KEYS</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        As API Keys permitem acesso programático à API do Kombatly. Guarda cada chave de forma segura — só é mostrada uma vez.
      </p>

      {/* New key shown once */}
      {createdKey && (
        <div className="rounded-lg border border-green-500/40 bg-green-500/5 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-green-400">
              Guarda esta chave agora — não será mostrada novamente.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded border border-border bg-surface-elevated px-3 py-2 text-xs font-mono text-foreground break-all">
              {createdKey}
            </code>
            <button
              onClick={copyKey}
              className="flex items-center gap-1.5 rounded border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <button
            onClick={() => setCreatedKey(null)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Já guardei, fechar
          </button>
        </div>
      )}

      {/* Create form */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <h2 className="font-heading text-lg text-foreground flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" /> Nova Chave
        </h2>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createKey()}
            placeholder="Ex: Integração Federação, App Árbitros..."
            className="flex-1 rounded border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          />
          <button
            onClick={createKey}
            disabled={creating || !newName.trim()}
            className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
            Criar
          </button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {/* Keys list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-lg border border-dashed border-border text-center">
          <Key className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Sem chaves criadas</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-3 border-b border-border bg-surface-elevated px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="col-span-4">Nome</span>
            <span className="col-span-3">Prefixo</span>
            <span className="col-span-3">Criada</span>
            <span className="col-span-2" />
          </div>
          <ul className="divide-y divide-border">
            {keys.map((k) => (
              <li key={k.id} className="grid grid-cols-1 gap-1 px-5 py-3.5 text-sm sm:grid-cols-12 sm:items-center sm:gap-3">
                <div className="col-span-4 font-medium text-foreground">{k.name}</div>
                <div className="col-span-3">
                  <code className="rounded bg-surface-elevated px-2 py-0.5 text-xs font-mono text-muted-foreground">
                    {k.prefix}...
                  </code>
                </div>
                <div className="col-span-3 text-muted-foreground text-xs">{fmt(k.createdAt)}</div>
                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={() => revokeKey(k.id)}
                    disabled={revoking === k.id}
                    className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:border-destructive hover:text-destructive transition-colors disabled:opacity-50"
                    title="Revogar chave"
                  >
                    {revoking === k.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    Revogar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
