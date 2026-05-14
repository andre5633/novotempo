"use client";
import DashboardLayout from "../../dashboard-layout";
import PageHeader from "@/components/PageHeader";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { CpfCnpjInput } from "@/components/InputMask";

export default function NovoClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nome: "",
    cpfCnpj: "",
    tipo: "produtor",
    telefone: "",
    email: "",
    cidade: "",
    estado: "",
    inscricaoEstadual: "",
    fazenda: "",
    endereco: "",
    banco: "",
    agencia: "",
    conta: "",
    pix: "",
  });

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) {
        router.push("/clientes");
      } else {
        setError(d.error || "Erro ao salvar cliente");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <PageHeader title="Novo Cliente" backHref="/clientes" />
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-full">
              <label className="label">Nome completo *</label>
              <input className="input" required value={form.nome} onChange={(e) => set("nome", e.target.value)} />
            </div>
            <div>
              <label className="label">CPF / CNPJ *</label>
              <CpfCnpjInput className="input" required value={form.cpfCnpj} onChange={(v) => set("cpfCnpj", v)} placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="label">Tipo *</label>
              <select className="input" value={form.tipo} onChange={(e) => set("tipo", e.target.value)}>
                <option value="produtor">Produtor</option>
                <option value="comprador">Comprador</option>
                <option value="ambos">Produtor e Comprador</option>
              </select>
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={form.telefone} onChange={(e) => set("telefone", e.target.value)} placeholder="(34) 99999-9999" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label className="label">Cidade</label>
              <input className="input" value={form.cidade} onChange={(e) => set("cidade", e.target.value)} />
            </div>
            <div>
              <label className="label">Estado</label>
              <input className="input" value={form.estado} onChange={(e) => set("estado", e.target.value)} placeholder="MG" maxLength={2} />
            </div>
            <div>
              <label className="label">Inscrição Estadual</label>
              <input className="input" value={form.inscricaoEstadual} onChange={(e) => set("inscricaoEstadual", e.target.value)} />
            </div>
            <div className="col-span-full">
              <label className="label">Fazenda / Local de Produção (para Produtores)</label>
              <input className="input" value={form.fazenda} onChange={(e) => set("fazenda", e.target.value)} placeholder="Fazenda Santo Antônio" />
            </div>
            <div className="col-span-full">
              <label className="label">Endereço Completo (para Compradores)</label>
              <input className="input" value={form.endereco} onChange={(e) => set("endereco", e.target.value)} placeholder="Rua, Número, Bairro" />
            </div>

            <div className="col-span-full pt-4 border-t border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Dados Bancários para Recebimento</h3>
            </div>
            <div>
              <label className="label">Banco</label>
              <input className="input" value={form.banco} onChange={(e) => set("banco", e.target.value)} placeholder="Sicoob, BB, etc" />
            </div>
            <div>
              <label className="label">Agência</label>
              <input className="input" value={form.agencia} onChange={(e) => set("agencia", e.target.value)} />
            </div>
            <div>
              <label className="label">Conta Corrente</label>
              <input className="input" value={form.conta} onChange={(e) => set("conta", e.target.value)} />
            </div>
            <div>
              <label className="label">PIX (Chave)</label>
              <input className="input" value={form.pix} onChange={(e) => set("pix", e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Salvando..." : "Salvar Cliente"}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
