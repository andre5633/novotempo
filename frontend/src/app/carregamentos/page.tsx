"use client";
import DashboardLayout from "../dashboard-layout";
import PageHeader from "@/components/PageHeader";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

interface Carregamento {
  id: string; numeroId: string; dataEnvio?: string; motorista?: string;
  produto?: string; pesoKg: number; qntSacas: number; valorCarga: number;
  contrato: { id: string; numeroId: string; comprador: { nome: string }; produtor: { nome: string }; };
}

export default function CarregamentosPage() {
  const [items, setItems] = useState<Carregamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/carregamentos").then((r) => r.json()).then((d) => { setItems(d); setLoading(false); });
  }, []);

  const totalSacas = items.reduce((s, c) => s + c.qntSacas, 0);
  const totalPeso = items.reduce((s, c) => s + c.pesoKg, 0);
  const totalValor = items.reduce((s, c) => s + c.valorCarga, 0);

  return (
    <DashboardLayout>
      <PageHeader title="Carregamentos" subtitle={`${items.length} registros`} />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center"><p className="text-xs text-gray-500 mb-1">Total Sacas</p><p className="text-xl font-bold">{formatNumber(totalSacas, 0)}</p></div>
        <div className="card text-center"><p className="text-xs text-gray-500 mb-1">Peso Total (kg)</p><p className="text-xl font-bold">{formatNumber(totalPeso, 0)}</p></div>
        <div className="card text-center"><p className="text-xs text-gray-500 mb-1">Valor Total</p><p className="text-xl font-bold text-bt-dark">{formatCurrency(totalValor)}</p></div>
      </div>
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin w-6 h-6 border-4 border-bt-mid border-t-transparent rounded-full" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead><tr className="border-b border-gray-100">
                <th className="table-th">ID</th><th className="table-th">Contrato</th>
                <th className="table-th">Comprador</th><th className="table-th">Produtor</th>
                <th className="table-th">Data Envio</th><th className="table-th">Produto</th>
                <th className="table-th">Motorista</th><th className="table-th">Sacas</th>
                <th className="table-th">Peso (kg)</th><th className="table-th">Valor Carga</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {items.length === 0 ? (
                  <tr><td colSpan={10} className="table-td text-center text-gray-400 py-10">Nenhum carregamento encontrado</td></tr>
                ) : items.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="table-td text-xs text-gray-500">{c.numeroId}</td>
                    <td className="table-td"><Link href={`/contratos/${c.contrato.id}`} className="text-bt-mid font-medium hover:underline">{c.contrato.numeroId}</Link></td>
                    <td className="table-td">{c.contrato.comprador.nome}</td>
                    <td className="table-td">{c.contrato.produtor.nome}</td>
                    <td className="table-td">{formatDate(c.dataEnvio)}</td>
                    <td className="table-td">{c.produto || "-"}</td>
                    <td className="table-td">{c.motorista || "-"}</td>
                    <td className="table-td">{formatNumber(c.qntSacas, 0)}</td>
                    <td className="table-td">{formatNumber(c.pesoKg, 0)}</td>
                    <td className="table-td font-medium">{formatCurrency(c.valorCarga)}</td>
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
