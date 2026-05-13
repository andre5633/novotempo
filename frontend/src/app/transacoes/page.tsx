"use client";
import DashboardLayout from "../dashboard-layout";
import PageHeader from "@/components/PageHeader";
import { TransacaoStatusBadge } from "@/components/StatusBadge";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

interface Transacao {
  id: string; numeroId: string; categoria?: string; dataTransacao?: string;
  metodoPagamento?: string; nfs?: string; status: string; valorDebitado: number;
  refComissao: number;
  contrato: { id: string; numeroId: string; comprador: { nome: string }; produtor: { nome: string }; };
}

export default function TransacoesPage() {
  const [items, setItems] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await apiFetch(`/transacoes?${params}`);
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [status]);

  const totalDebitado = items.reduce((s, t) => s + t.valorDebitado, 0);
  const totalComissao = items.reduce((s, t) => s + t.refComissao, 0);

  return (
    <DashboardLayout>
      <PageHeader title="Transações" subtitle={`${items.length} registros`} />
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card text-center"><p className="text-xs text-gray-500 mb-1">Total Debitado</p><p className="text-xl font-bold text-bt-dark">{formatCurrency(totalDebitado)}</p></div>
        <div className="card text-center"><p className="text-xs text-gray-500 mb-1">Total Comissão</p><p className="text-xl font-bold text-green-700">{formatCurrency(totalComissao)}</p></div>
      </div>
      <div className="card">
        <div className="mb-4">
          <select className="input w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin w-6 h-6 border-4 border-bt-mid border-t-transparent rounded-full" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead><tr className="border-b border-gray-100">
                <th className="table-th">ID</th><th className="table-th">Contrato</th>
                <th className="table-th">Comprador</th><th className="table-th">Categoria</th>
                <th className="table-th">Data</th><th className="table-th">Método</th>
                <th className="table-th">Valor Debitado</th><th className="table-th">Ref. Comissão</th>
                <th className="table-th">NF</th><th className="table-th">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {items.length === 0 ? (
                  <tr><td colSpan={10} className="table-td text-center text-gray-400 py-10">Nenhuma transação encontrada</td></tr>
                ) : items.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="table-td text-xs text-gray-500">{t.numeroId}</td>
                    <td className="table-td"><Link href={`/contratos/${t.contrato.id}`} className="text-bt-mid font-medium hover:underline">{t.contrato.numeroId}</Link></td>
                    <td className="table-td">{t.contrato.comprador.nome}</td>
                    <td className="table-td">{t.categoria || "-"}</td>
                    <td className="table-td">{formatDate(t.dataTransacao)}</td>
                    <td className="table-td">{t.metodoPagamento || "-"}</td>
                    <td className="table-td font-medium">{formatCurrency(t.valorDebitado)}</td>
                    <td className="table-td">{formatCurrency(t.refComissao)}</td>
                    <td className="table-td text-xs">{t.nfs || "-"}</td>
                    <td className="table-td"><TransacaoStatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
