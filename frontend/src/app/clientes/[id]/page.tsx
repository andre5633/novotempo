"use client";
import DashboardLayout from "../../dashboard-layout";
import PageHeader from "@/components/PageHeader";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function EditarClientePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    apiFetch(`/clientes/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setForm({
          nome: d.nome || "",
          cpfCnpj: d.cpfCnpj || "",
          tipo: d.tipo || "produtor",
          telefone: d.telefone || "",
          email: d.email || "",
          cidade: d.cidade || "",
          estado: d.estado || "",
          inscricaoEstadual: d.inscricaoEstadual || "",
          fazenda: d.fazenda || "",
          endereco: d.endereco || "",
          banco: d.banco || "",
          agencia: d.agencia || "",
          conta: d.conta || "",
          pix: d.pix || "",
        });
        setLoading(false);
      });
  }, [id]);

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await apiFetch(`/clientes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/clientes");
    } else {
      const d = await res.json();
      setError(d.error || "Erro ao salvar");
    }
  }

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-10">
        <div className="animate-spin w-6 h-6 border-4 border-bt-mid border-t-transparent rounded-full" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <PageHeader title="Editar Cliente" backHref="/clientes" />
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-full">
              <label className="label">Nome completo *</label>
              <input className="input" required value={form.nome} onChange={(e) => set("nome", e.target.value)} />
            </div>
            <div>
              <label className="label">CPF / CNPJ *</label>
              <input className="input" required value={form.cpfCnpj} onChange={(e) => set("cpfCnpj", e.target.value)} />
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
              <input className="input" value={form.telefone} onChange={(e) => set("telefone", e.target.value)} />
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
              <input className="input" value={form.estado} onChange={(e) => set("estado", e.target.value)} maxLength={2} />
            </div>
            <div className="col-span-full border-t border-gray-100 pt-4 mt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Informações Adicionais</h3>
            </div>
            <div>
              <label className="label">Inscrição Estadual</label>
              <input className="input" value={form.inscricaoEstadual} onChange={(e) => set("inscricaoEstadual", e.target.value)} />
            </div>
            <div>
              <label className="label">Fazenda</label>
              <input className="input" value={form.fazenda} onChange={(e) => set("fazenda", e.target.value)} />
            </div>
            <div className="col-span-full">
              <label className="label">Endereço Completo</label>
              <input className="input" value={form.endereco} onChange={(e) => set("endereco", e.target.value)} />
            </div>
            <div className="col-span-full border-t border-gray-100 pt-4 mt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Dados Bancários</h3>
            </div>
            <div>
              <label className="label">Banco</label>
              <input className="input" value={form.banco} onChange={(e) => set("banco", e.target.value)} />
            </div>
            <div>
              <label className="label">Agência</label>
              <input className="input" value={form.agencia} onChange={(e) => set("agencia", e.target.value)} />
            </div>
            <div>
              <label className="label">Conta</label>
              <input className="input" value={form.conta} onChange={(e) => set("conta", e.target.value)} />
            </div>
            <div>
              <label className="label">PIX</label>
              <input className="input" value={form.pix} onChange={(e) => set("pix", e.target.value)} />
            </div>
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
