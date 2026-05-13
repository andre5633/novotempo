"use client";
import DashboardLayout from "../../dashboard-layout";
import PageHeader from "@/components/PageHeader";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface Cliente { id: string; nome: string; cpfCnpj: string; tipo: string; }

const PRODUTOS = ["Soja", "Milho", "Sorgo", "Trigo", "Feijão", "Algodão", "Café", "Outro"];

export default function NovoContratoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState({
    status: "nao_iniciado",
    produto: "",
    compradorId: "",
    produtorId: "",
    cidade: "",
    numSacas: "",
    valorSaca: "",
    comissaoPorSaca: "",
    comissaoTerceiro: "",
    dataFechamento: "",
    inicio: "",
    termino: "",
    fechamentoOrigem: "",
    fechamentoDestino: "",
    refPeso: "",
    comissaoPagaPor: "comprador",
    comissaoVendedor: "",
    comissaoComprador: "",
    fretePorConta: "CIF POR CONTA DO VENDEDOR",
    localRetirada: "",
    condicoesPagamento: "SOBRE RODAS",
    funrural: "0",
    foro: "UBERLÂNDIA-MG",
    observacoes: "",
  });

  useEffect(() => {
    apiFetch("/clientes").then((r) => r.json()).then(setClientes);
  }, []);

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const produtores = clientes.filter((c) => c.tipo === "produtor" || c.tipo === "ambos");
  const compradores = clientes.filter((c) => c.tipo === "comprador" || c.tipo === "ambos");

  // Calculated preview
  const numSacas = Number(form.numSacas) || 0;
  const valorSaca = Number(form.valorSaca) || 0;
  const comissaoPorSaca = Number(form.comissaoPorSaca) || 0;
  const valorContrato = numSacas * valorSaca;
  const comissaoProjetada = numSacas * comissaoPorSaca;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/contratos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) {
        router.push(`/contratos/${d.id}`);
      } else {
        setError(d.error || "Erro ao salvar contrato");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <PageHeader title="Novo Contrato" backHref="/contratos" />
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dados principais */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Dados do Contrato</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Produto *</label>
                  <select className="input" required value={form.produto} onChange={(e) => set("produto", e.target.value)}>
                    <option value="">Selecione...</option>
                    {PRODUTOS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
                    <option value="nao_iniciado">Não Iniciado</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </div>
                <div>
                  <label className="label">Comprador *</label>
                  <select className="input" required value={form.compradorId} onChange={(e) => set("compradorId", e.target.value)}>
                    <option value="">Selecione...</option>
                    {compradores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Produtor *</label>
                  <select className="input" required value={form.produtorId} onChange={(e) => set("produtorId", e.target.value)}>
                    <option value="">Selecione...</option>
                    {produtores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Cidade</label>
                  <input className="input" value={form.cidade} onChange={(e) => set("cidade", e.target.value)} />
                </div>
                <div>
                  <label className="label">Fechamento Origem</label>
                  <input className="input" value={form.fechamentoOrigem} onChange={(e) => set("fechamentoOrigem", e.target.value)} />
                </div>
                <div>
                  <label className="label">Fechamento Destino</label>
                  <input className="input" value={form.fechamentoDestino} onChange={(e) => set("fechamentoDestino", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Valores</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nº de Sacas *</label>
                  <input className="input" type="number" step="0.01" required value={form.numSacas} onChange={(e) => set("numSacas", e.target.value)} />
                </div>
                <div>
                  <label className="label">Valor por Saca (R$) *</label>
                  <input className="input" type="number" step="0.01" required value={form.valorSaca} onChange={(e) => set("valorSaca", e.target.value)} />
                </div>
                <div>
                  <label className="label">Comissão por Saca (R$)</label>
                  <input className="input" type="number" step="0.01" value={form.comissaoPorSaca} onChange={(e) => set("comissaoPorSaca", e.target.value)} />
                </div>
                <div>
                  <label className="label">Comissão Terceiro (R$)</label>
                  <input className="input" type="number" step="0.01" value={form.comissaoTerceiro} onChange={(e) => set("comissaoTerceiro", e.target.value)} />
                </div>
                <div>
                  <label className="label">Ref. Peso</label>
                  <input className="input" type="number" step="0.001" value={form.refPeso} onChange={(e) => set("refPeso", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Comissões (Ganhando nas duas pontas)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Comissão paga por</label>
                  <select className="input" value={form.comissaoPagaPor} onChange={(e) => set("comissaoPagaPor", e.target.value)}>
                    <option value="comprador">Comprador</option>
                    <option value="vendedor">Vendedor (Produtor)</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
                <div>
                  <label className="label">Comissão do Comprador (R$/SC)</label>
                  <input className="input" type="number" step="0.01" value={form.comissaoComprador} onChange={(e) => set("comissaoComprador", e.target.value)} />
                </div>
                <div>
                  <label className="label">Comissão do Vendedor (R$/SC)</label>
                  <input className="input" type="number" step="0.01" value={form.comissaoVendedor} onChange={(e) => set("comissaoVendedor", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Logística e Condições</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Frete</label>
                  <input className="input" value={form.fretePorConta} onChange={(e) => set("fretePorConta", e.target.value)} placeholder="CIF POR CONTA DO VENDEDOR" />
                </div>
                <div className="col-span-2">
                  <label className="label">Local de Retirada</label>
                  <input className="input" value={form.localRetirada} onChange={(e) => set("localRetirada", e.target.value)} placeholder="Silo do Renato, Fazenda..." />
                </div>
                <div>
                  <label className="label">Condições de Pagamento</label>
                  <input className="input" value={form.condicoesPagamento} onChange={(e) => set("condicoesPagamento", e.target.value)} placeholder="SOBRE RODAS" />
                </div>
                <div>
                  <label className="label">Funrural (%)</label>
                  <input className="input" type="number" step="0.01" value={form.funrural} onChange={(e) => set("funrural", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="label">Foro da Comarca</label>
                  <input className="input" value={form.foro} onChange={(e) => set("foro", e.target.value)} placeholder="UBERLÂNDIA-MG" />
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Datas</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Data Fechamento</label>
                  <input className="input" type="date" value={form.dataFechamento} onChange={(e) => set("dataFechamento", e.target.value)} />
                </div>
                <div>
                  <label className="label">Início</label>
                  <input className="input" type="date" value={form.inicio} onChange={(e) => set("inicio", e.target.value)} />
                </div>
                <div>
                  <label className="label">Término</label>
                  <input className="input" type="date" value={form.termino} onChange={(e) => set("termino", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="card">
              <label className="label">Observações</label>
              <textarea className="input" rows={3} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="card bg-bt-pale border-bt-accent">
              <h3 className="font-semibold text-bt-dark mb-4">Resumo</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nº Sacas</span>
                  <span className="font-medium">{numSacas.toLocaleString("pt-BR")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Valor/Saca</span>
                  <span className="font-medium">R$ {valorSaca.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-bt-accent pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-gray-700">Valor Contrato</span>
                    <span className="font-bold text-bt-dark">
                      R$ {valorContrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Comissão Comprador</span>
                  <span className="font-medium text-green-700">R$ {(numSacas * (Number(form.comissaoComprador) || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Comissão Vendedor</span>
                  <span className="font-medium text-green-700">R$ {(numSacas * (Number(form.comissaoVendedor) || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-100">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? "Salvando..." : "Criar Contrato"}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary w-full justify-center">
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
