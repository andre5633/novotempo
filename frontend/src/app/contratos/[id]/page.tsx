"use client";
import DashboardLayout from "../../dashboard-layout";
import { ContratoStatusBadge, TransacaoStatusBadge } from "@/components/StatusBadge";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatCurrency, formatNumber, formatDate, calcContrato } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

const PRODUTOS = ["Soja", "Milho", "Sorgo", "Trigo", "Feijão", "Algodão", "Café", "Outro"];

interface Cliente { id: string; nome: string; cpfCnpj: string; tipo: string; }
interface Carregamento {
  id: string; numeroId: string; dataEnvio?: string; motorista?: string; corretor?: string;
  produto?: string; pesoKg: number; qntSacas: number; valorCarga: number; refPeso: number;
  refValorSaca: number; umidadeSorgo?: number; observacoes?: string;
}
interface Transacao {
  id: string; numeroId: string; categoria?: string; dataTransacao?: string;
  metodoPagamento?: string; nfs?: string; status: string; tipoDaNota?: string;
  valorDebitado: number; refProdutor: number; refComissao: number; observacoes?: string;
}
interface Contrato {
  id: string; numeroId: string; status: string; produto: string; cidade?: string;
  numSacas: number; valorSaca: number; comissaoPorSaca: number; comissaoTerceiro: number;
  dataFechamento?: string; inicio?: string; termino?: string;
  fechamentoOrigem?: string; fechamentoDestino?: string; refPeso: number; observacoes?: string;
  comissaoPagaPor: string; comissaoVendedor: number; comissaoComprador: number;
  fretePorConta?: string; localRetirada?: string; condicoesPagamento?: string;
  funrural: number; foro?: string;
  comprador: { id: string; nome: string; cpfCnpj: string; endereco?: string; };
  produtor: { id: string; nome: string; cpfCnpj: string; inscricaoEstadual?: string; fazenda?: string; banco?: string; agencia?: string; conta?: string; pix?: string; };
  carregamentos: Carregamento[];
  transacoes: Transacao[];
}

function InfoRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}

export default function ContratoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});

  const [showCarrModal, setShowCarrModal] = useState(false);
  const [showTrxModal, setShowTrxModal] = useState(false);
  const [editingCarr, setEditingCarr] = useState<Carregamento | null>(null);
  const [editingTrx, setEditingTrx] = useState<Transacao | null>(null);
  const [carrForm, setCarrForm] = useState<Record<string, string>>({});
  const [trxForm, setTrxForm] = useState<Record<string, string>>({});
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  async function load() {
    const res = await apiFetch(`/contratos/${id}`);
    const data = await res.json();
    setContrato(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    apiFetch("/clientes").then((r) => r.json()).then(setClientes);
  }, [id]);

  if (loading || !contrato) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-bt-mid border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  const calc = calcContrato(contrato);
  const produtores = clientes.filter((c) => c.tipo === "produtor" || c.tipo === "ambos");
  const compradores = clientes.filter((c) => c.tipo === "comprador" || c.tipo === "ambos");

  function startEdit() {
    setEditForm({
      status: contrato!.status, produto: contrato!.produto, cidade: contrato!.cidade || "",
      compradorId: contrato!.comprador.id, produtorId: contrato!.produtor.id,
      numSacas: contrato!.numSacas, valorSaca: contrato!.valorSaca,
      comissaoPorSaca: contrato!.comissaoPorSaca, comissaoTerceiro: contrato!.comissaoTerceiro,
      refPeso: contrato!.refPeso,
      dataFechamento: contrato!.dataFechamento ? contrato!.dataFechamento.split("T")[0] : "",
      inicio: contrato!.inicio ? contrato!.inicio.split("T")[0] : "",
      termino: contrato!.termino ? contrato!.termino.split("T")[0] : "",
      fechamentoOrigem: contrato!.fechamentoOrigem || "",
      fechamentoDestino: contrato!.fechamentoDestino || "",
      comissaoPagaPor: contrato!.comissaoPagaPor,
      comissaoVendedor: contrato!.comissaoVendedor,
      comissaoComprador: contrato!.comissaoComprador,
      fretePorConta: contrato!.fretePorConta || "",
      localRetirada: contrato!.localRetirada || "",
      condicoesPagamento: contrato!.condicoesPagamento || "",
      funrural: contrato!.funrural,
      foro: contrato!.foro || "",
      observacoes: contrato!.observacoes || "",
    });
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    const body = { ...editForm };
    if (!body.dataFechamento) delete body.dataFechamento;
    if (!body.inicio) delete body.inicio;
    if (!body.termino) delete body.termino;
    await apiFetch(`/contratos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setEditing(false);
    load();
  }

  async function deleteContrato() {
    if (!confirm(`Excluir o contrato ${contrato!.numeroId}?`)) return;
    await apiFetch(`/contratos/${id}`, { method: "DELETE" });
    router.push("/contratos");
  }

  function openCarrModal(carr?: Carregamento) {
    setModalError("");
    setEditingCarr(carr || null);
    setCarrForm(carr ? {
      dataEnvio: carr.dataEnvio ? carr.dataEnvio.split("T")[0] : "",
      motorista: carr.motorista || "", corretor: carr.corretor || "",
      produto: carr.produto || contrato!.produto, pesoKg: String(carr.pesoKg),
      qntSacas: String(carr.qntSacas), valorCarga: String(carr.valorCarga),
      refPeso: String(carr.refPeso), refValorSaca: String(carr.refValorSaca),
      umidadeSorgo: carr.umidadeSorgo != null ? String(carr.umidadeSorgo) : "",
      observacoes: carr.observacoes || "",
    } : { produto: contrato!.produto, dataEnvio: "", motorista: "", corretor: "", pesoKg: "", qntSacas: "", valorCarga: "", refPeso: "", refValorSaca: "", umidadeSorgo: "", observacoes: "" });
    setShowCarrModal(true);
  }

  async function saveCarr() {
    setModalLoading(true);
    setModalError("");
    try {
      const url = editingCarr ? `/carregamentos/${editingCarr.id}` : "/carregamentos";
      const res = await apiFetch(url, { method: editingCarr ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...carrForm, contratoId: id }) });
      const d = await res.json();
      if (res.ok) {
        setShowCarrModal(false);
        load();
      } else {
        setModalError(d.error || "Erro ao salvar carregamento");
      }
    } catch {
      setModalError("Erro de conexão. Tente novamente.");
    } finally {
      setModalLoading(false);
    }
  }

  async function deleteCarr(carrId: string) {
    if (!confirm("Excluir este carregamento?")) return;
    await apiFetch(`/carregamentos/${carrId}`, { method: "DELETE" }); load();
  }

  function openTrxModal(trx?: Transacao) {
    setModalError("");
    setEditingTrx(trx || null);
    setTrxForm(trx ? {
      categoria: trx.categoria || "", dataTransacao: trx.dataTransacao ? trx.dataTransacao.split("T")[0] : "",
      metodoPagamento: trx.metodoPagamento || "", nfs: trx.nfs || "", status: trx.status,
      tipoDaNota: trx.tipoDaNota || "", valorDebitado: String(trx.valorDebitado),
      refProdutor: String(trx.refProdutor), refComissao: String(trx.refComissao), observacoes: trx.observacoes || "",
    } : { categoria: "", dataTransacao: "", metodoPagamento: "", nfs: "", status: "pendente", tipoDaNota: "", valorDebitado: "", refProdutor: "", refComissao: "", observacoes: "" });
    setShowTrxModal(true);
  }

  async function saveTrx() {
    setModalLoading(true);
    setModalError("");
    try {
      const url = editingTrx ? `/transacoes/${editingTrx.id}` : "/transacoes";
      const res = await apiFetch(url, { method: editingTrx ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...trxForm, contratoId: id }) });
      const d = await res.json();
      if (res.ok) {
        setShowTrxModal(false);
        load();
      } else {
        setModalError(d.error || "Erro ao salvar transação");
      }
    } catch {
      setModalError("Erro de conexão. Tente novamente.");
    } finally {
      setModalLoading(false);
    }
  }

  async function deleteTrx(trxId: string) {
    if (!confirm("Excluir esta transação?")) return;
    await apiFetch(`/transacoes/${trxId}`, { method: "DELETE" }); load();
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/contratos")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{contrato.numeroId}</h1>
              <ContratoStatusBadge status={contrato.status} />
            </div>
            <p className="text-sm text-gray-500">{contrato.produto} · {contrato.comprador.nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api"}/contratos/${id}/pdf?view=vendedor`} target="_blank" className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 text-xs font-semibold border-r border-gray-200 flex items-center gap-1.5 transition-colors">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Contrato Produtor
            </a>
            <a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api"}/contratos/${id}/pdf?view=comprador`} target="_blank" className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 text-xs font-semibold border-r border-gray-200 flex items-center gap-1.5 transition-colors">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Contrato Comprador
            </a>
            <a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api"}/contratos/${id}/pdf?view=unificado`} target="_blank" className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Contrato Unificado
            </a>
          </div>
          {isAdmin && !editing && (
            <>
              <button onClick={startEdit} className="btn-primary text-sm py-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Editar
              </button>
              <button onClick={deleteContrato} className="btn-danger text-sm py-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Excluir
              </button>
            </>
          )}
          {editing && (
            <>
              <button onClick={saveEdit} disabled={saving} className="btn-primary text-sm py-1.5">{saving ? "Salvando..." : "Salvar"}</button>
              <button onClick={() => setEditing(false)} className="btn-secondary text-sm py-1.5">Cancelar</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Dados / Edição */}
          {!editing ? (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">Informações do Contrato</h3>
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <InfoRow label="Produto" value={contrato.produto} />
                  <InfoRow label="Comprador" value={contrato.comprador.nome} />
                  <InfoRow label="Produtor" value={contrato.produtor.nome} />
                  <InfoRow label="Cidade" value={contrato.cidade || "-"} />
                  <InfoRow label="Fechamento Origem" value={contrato.fechamentoOrigem || "-"} />
                  <InfoRow label="Fechamento Destino" value={contrato.fechamentoDestino || "-"} />
                  <InfoRow label="Comissão Paga Por" value={contrato.comissaoPagaPor.toUpperCase()} />
                </div>
                <div>
                  <InfoRow label="Data Fechamento" value={formatDate(contrato.dataFechamento)} />
                  <InfoRow label="Início" value={formatDate(contrato.inicio)} />
                  <InfoRow label="Término" value={formatDate(contrato.termino)} />
                  <InfoRow label="Ref. Peso" value={formatNumber(contrato.refPeso, 3)} />
                  <InfoRow label="Frete" value={contrato.fretePorConta || "-"} />
                  <InfoRow label="Retirada" value={contrato.localRetirada || "-"} />
                  <InfoRow label="Foro" value={contrato.foro || "-"} />
                </div>
              </div>
              {contrato.observacoes && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Observações</p>
                  <p className="text-sm text-gray-700">{contrato.observacoes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Editar Contrato</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Produto", key: "produto", type: "select", opts: PRODUTOS },
                  { label: "Status", key: "status", type: "select", opts: ["nao_iniciado:Não Iniciado", "em_andamento:Em Andamento", "concluido:Concluído"] },
                  { label: "Comprador", key: "compradorId", type: "select-clientes", opts: compradores },
                  { label: "Produtor", key: "produtorId", type: "select-clientes", opts: produtores },
                  { label: "Cidade", key: "cidade" },
                  { label: "Nº Sacas", key: "numSacas", type: "number" },
                  { label: "Valor/Saca (R$)", key: "valorSaca", type: "number" },
                  { label: "Comissão/Saca (R$)", key: "comissaoPorSaca", type: "number" },
                  { label: "Comissão Terceiro (R$)", key: "comissaoTerceiro", type: "number" },
                  { label: "Ref. Peso", key: "refPeso", type: "number" },
                  { label: "Fechamento Origem", key: "fechamentoOrigem" },
                  { label: "Fechamento Destino", key: "fechamentoDestino" },
                  { label: "Data Fechamento", key: "dataFechamento", type: "date" },
                  { label: "Início", key: "inicio", type: "date" },
                  { label: "Término", key: "termino", type: "date" },
                  { label: "Comissão paga por", key: "comissaoPagaPor", type: "select", opts: ["vendedor:Vendedor", "comprador:Comprador", "ambos:Ambos"] },
                  { label: "Comissão Vendedor (R$/SC)", key: "comissaoVendedor", type: "number" },
                  { label: "Comissão Comprador (R$/SC)", key: "comissaoComprador", type: "number" },
                  { label: "Frete", key: "fretePorConta" },
                  { label: "Retirada", key: "localRetirada" },
                  { label: "Pagamento", key: "condicoesPagamento" },
                  { label: "Funrural (%)", key: "funrural", type: "number" },
                  { label: "Foro", key: "foro" },
                ].map(({ label, key, type, opts }) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    {type === "select" ? (
                      <select className="input" value={String(editForm[key] || "")} onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}>
                        {(opts as string[]).map((o) => {
                          const [val, lbl] = o.includes(":") ? o.split(":") : [o, o];
                          return <option key={val} value={val}>{lbl}</option>;
                        })}
                      </select>
                    ) : type === "select-clientes" ? (
                      <select className="input" value={String(editForm[key] || "")} onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}>
                        {(opts as Cliente[]).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    ) : (
                      <input className="input" type={type || "text"} step={type === "number" ? "0.01" : undefined}
                        value={String(editForm[key] || "")} onChange={(e) => setEditForm((f) => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))} />
                    )}
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="label">Observações</label>
                  <textarea className="input" rows={2} value={String(editForm.observacoes || "")} onChange={(e) => setEditForm((f) => ({ ...f, observacoes: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {/* Carregamentos */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Carregamentos ({contrato.carregamentos.length})</h3>
              <button onClick={() => openCarrModal()} className="btn-primary text-sm py-1.5">+ Adicionar</button>
            </div>
            {contrato.carregamentos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum carregamento registrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead><tr className="border-b border-gray-100">
                    <th className="table-th">ID</th><th className="table-th">Data</th><th className="table-th">Motorista</th>
                    <th className="table-th">Sacas</th><th className="table-th">Peso(kg)</th><th className="table-th">Valor Carga</th>
                    <th className="table-th">Umidade</th><th className="table-th">Ações</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {contrato.carregamentos.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="table-td text-xs text-gray-500">{c.numeroId}</td>
                        <td className="table-td">{formatDate(c.dataEnvio)}</td>
                        <td className="table-td">{c.motorista || "-"}</td>
                        <td className="table-td">{formatNumber(c.qntSacas, 0)}</td>
                        <td className="table-td">{formatNumber(c.pesoKg, 0)}</td>
                        <td className="table-td">{formatCurrency(c.valorCarga)}</td>
                        <td className="table-td">{c.umidadeSorgo != null ? `${c.umidadeSorgo}%` : "-"}</td>
                        <td className="table-td">
                          <div className="flex gap-2">
                            <button onClick={() => openCarrModal(c)} className="text-bt-mid text-xs hover:underline">Editar</button>
                            {isAdmin && <button onClick={() => deleteCarr(c.id)} className="text-red-500 text-xs hover:underline">Excluir</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="bg-bt-pale">
                    <td colSpan={3} className="table-td font-semibold text-bt-dark">Total</td>
                    <td className="table-td font-semibold">{formatNumber(calc.sacasRetiradas, 0)}</td>
                    <td className="table-td font-semibold">{formatNumber(contrato.carregamentos.reduce((s, c) => s + c.pesoKg, 0), 0)}</td>
                    <td className="table-td font-semibold">{formatCurrency(calc.valorCarregado)}</td>
                    <td colSpan={2} />
                  </tr></tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Transações */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Transações ({contrato.transacoes.length})</h3>
              <button onClick={() => openTrxModal()} className="btn-primary text-sm py-1.5">+ Adicionar</button>
            </div>
            {contrato.transacoes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma transação registrada</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead><tr className="border-b border-gray-100">
                    <th className="table-th">ID</th><th className="table-th">Categoria</th><th className="table-th">Data</th>
                    <th className="table-th">Método</th><th className="table-th">Valor Debitado</th>
                    <th className="table-th">Ref. Comissão</th><th className="table-th">NF</th>
                    <th className="table-th">Status</th><th className="table-th">Ações</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {contrato.transacoes.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="table-td text-xs text-gray-500">{t.numeroId}</td>
                        <td className="table-td">{t.categoria || "-"}</td>
                        <td className="table-td">{formatDate(t.dataTransacao)}</td>
                        <td className="table-td">{t.metodoPagamento || "-"}</td>
                        <td className="table-td font-medium">{formatCurrency(t.valorDebitado)}</td>
                        <td className="table-td">{formatCurrency(t.refComissao)}</td>
                        <td className="table-td text-xs">{t.nfs || "-"}</td>
                        <td className="table-td"><TransacaoStatusBadge status={t.status} /></td>
                        <td className="table-td">
                          <div className="flex gap-2">
                            <button onClick={() => openTrxModal(t)} className="text-bt-mid text-xs hover:underline">Editar</button>
                            {isAdmin && <button onClick={() => deleteTrx(t.id)} className="text-red-500 text-xs hover:underline">Excluir</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="bg-bt-pale">
                    <td colSpan={4} className="table-td font-semibold text-bt-dark">Total</td>
                    <td className="table-td font-semibold">{formatCurrency(calc.totalRecebidoCarga)}</td>
                    <td className="table-td font-semibold">{formatCurrency(calc.comissaoRecebida)}</td>
                    <td colSpan={3} />
                  </tr></tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Painel direito */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Resumo Financeiro</h3>
            <InfoRow label="Nº Sacas" value={formatNumber(contrato.numSacas, 0)} />
            <InfoRow label="Valor/Saca" value={formatCurrency(contrato.valorSaca)} />
            <InfoRow label="Valor Contrato" value={<span className="text-bt-dark font-bold">{formatCurrency(calc.valorContrato)}</span>} />
            <InfoRow label="Sacas Retiradas" value={formatNumber(calc.sacasRetiradas, 0)} />
            <InfoRow label="Sacas a Retirar" value={formatNumber(calc.sacasARetirar, 0)} />
            <InfoRow label="Valor Carregado" value={formatCurrency(calc.valorCarregado)} />
            <InfoRow label="Saldo Carregamento" value={formatCurrency(calc.saldoCarregamento)} />
            <div className="border-t border-gray-100 mt-2 pt-2">
              <InfoRow label="Valor Recebido" value={formatCurrency(calc.totalRecebidoCarga)} />
              <InfoRow label="% Recebida" value={`${formatNumber(calc.percRecebida, 1)}%`} />
              <InfoRow label="A Receber (Carga)" value={<span className="text-yellow-700 font-medium">{formatCurrency(calc.aReceberCarga)}</span>} />
            </div>
            <div className="border-t border-gray-100 mt-2 pt-2">
              <InfoRow label="Comissão Projetada" value={formatCurrency(calc.comissaoProjetada)} />
              <InfoRow label="Comissão Recebida" value={formatCurrency(calc.comissaoRecebida)} />
              <InfoRow label="% Comissão Rec." value={`${formatNumber(calc.percComissao, 1)}%`} />
              <InfoRow label="Comissão a Receber" value={<span className="text-yellow-700 font-medium">{formatCurrency(calc.comissaoAReceber)}</span>} />
            </div>
            <div className="border-t border-gray-100 mt-2 pt-2">
              <InfoRow label="Σ Ref. Peso Carr." value={formatNumber(calc.refPesoCarregamento, 3)} />
              <InfoRow label="Σ Ref. Produtor" value={formatCurrency(calc.refProdutor)} />
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Partes</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Comprador</p>
                <p className="text-sm font-medium">{contrato.comprador.nome}</p>
                <p className="text-xs text-gray-400">{contrato.comprador.cpfCnpj}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Produtor</p>
                <p className="text-sm font-medium">{contrato.produtor.nome}</p>
                <p className="text-xs text-gray-400">{contrato.produtor.cpfCnpj}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Carregamento */}
      {showCarrModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold">{editingCarr ? "Editar" : "Novo"} Carregamento</h3>
              <button onClick={() => setShowCarrModal(false)}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              {[
                { label: "Data Envio", key: "dataEnvio", type: "date" },
                { label: "Produto", key: "produto" },
                { label: "Motorista", key: "motorista" },
                { label: "Corretor", key: "corretor" },
                { label: "Qnt Sacas", key: "qntSacas", type: "number" },
                { label: "Peso (kg)", key: "pesoKg", type: "number" },
                { label: "Valor Carga (R$)", key: "valorCarga", type: "number" },
                { label: "Ref. Peso", key: "refPeso", type: "number" },
                { label: "Ref. Valor Saca", key: "refValorSaca", type: "number" },
                { label: "Umidade Sorgo (%)", key: "umidadeSorgo", type: "number" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input className="input" type={type || "text"} step={type === "number" ? "0.01" : undefined}
                    value={carrForm[key] || ""} onChange={(e) => setCarrForm((f) => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="col-span-2">
                <label className="label">Observações</label>
                <textarea className="input" rows={2} value={carrForm.observacoes || ""} onChange={(e) => setCarrForm((f) => ({ ...f, observacoes: e.target.value }))} />
              </div>
            </div>
            {modalError && <div className="mx-5 mb-2 bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{modalError}</div>}
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={saveCarr} disabled={modalLoading} className="btn-primary flex-1 justify-center">{modalLoading ? "Salvando..." : "Salvar"}</button>
              <button onClick={() => setShowCarrModal(false)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Transação */}
      {showTrxModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold">{editingTrx ? "Editar" : "Nova"} Transação</h3>
              <button onClick={() => setShowTrxModal(false)}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div><label className="label">Categoria</label><input className="input" value={trxForm.categoria || ""} onChange={(e) => setTrxForm((f) => ({ ...f, categoria: e.target.value }))} /></div>
              <div><label className="label">Data</label><input className="input" type="date" value={trxForm.dataTransacao || ""} onChange={(e) => setTrxForm((f) => ({ ...f, dataTransacao: e.target.value }))} /></div>
              <div><label className="label">Método Pagamento</label>
                <select className="input" value={trxForm.metodoPagamento || ""} onChange={(e) => setTrxForm((f) => ({ ...f, metodoPagamento: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {["PIX","TED","Boleto","Cheque","Dinheiro","Outro"].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div><label className="label">Status</label>
                <select className="input" value={trxForm.status || "pendente"} onChange={(e) => setTrxForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div><label className="label">Valor Debitado (R$)</label><input className="input" type="number" step="0.01" value={trxForm.valorDebitado || ""} onChange={(e) => setTrxForm((f) => ({ ...f, valorDebitado: e.target.value }))} /></div>
              <div><label className="label">Ref. Comissão (R$)</label><input className="input" type="number" step="0.01" value={trxForm.refComissao || ""} onChange={(e) => setTrxForm((f) => ({ ...f, refComissao: e.target.value }))} /></div>
              <div><label className="label">Ref. Produtor (R$)</label><input className="input" type="number" step="0.01" value={trxForm.refProdutor || ""} onChange={(e) => setTrxForm((f) => ({ ...f, refProdutor: e.target.value }))} /></div>
              <div><label className="label">NFs</label><input className="input" value={trxForm.nfs || ""} onChange={(e) => setTrxForm((f) => ({ ...f, nfs: e.target.value }))} /></div>
              <div><label className="label">Tipo da Nota</label><input className="input" value={trxForm.tipoDaNota || ""} onChange={(e) => setTrxForm((f) => ({ ...f, tipoDaNota: e.target.value }))} /></div>
              <div className="col-span-2"><label className="label">Observações</label><textarea className="input" rows={2} value={trxForm.observacoes || ""} onChange={(e) => setTrxForm((f) => ({ ...f, observacoes: e.target.value }))} /></div>
            </div>
            {modalError && <div className="mx-5 mb-2 bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{modalError}</div>}
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={saveTrx} disabled={modalLoading} className="btn-primary flex-1 justify-center">{modalLoading ? "Salvando..." : "Salvar"}</button>
              <button onClick={() => setShowTrxModal(false)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
