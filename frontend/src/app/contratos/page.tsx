"use client";
import DashboardLayout from "../dashboard-layout";
import PageHeader from "@/components/PageHeader";
import { ContratoStatusBadge } from "@/components/StatusBadge";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatCurrency, formatNumber, formatDate, calcContrato } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

interface Contrato {
  id: string;
  numeroId: string;
  status: string;
  produto: string;
  cidade?: string;
  numSacas: number;
  valorSaca: number;
  comissaoPorSaca: number;
  comissaoTerceiro: number;
  dataFechamento?: string;
  comprador: { id: string; nome: string };
  produtor: { id: string; nome: string };
  carregamentos: { qntSacas: number; valorCarga: number; refPeso: number }[];
  transacoes: { valorDebitado: number; refComissao: number; refProdutor: number }[];
}

export default function ContratosPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    const res = await apiFetch(`/contratos?${params}`);
    const data = await res.json();
    setContratos(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [status, q]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Contratos"
        subtitle={`${contratos.length} registros`}
        action={isAdmin ? { label: "Novo Contrato", href: "/contratos/novo" } : undefined}
      />

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            className="input sm:w-64"
            placeholder="Buscar por ID, produto, comprador..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="input sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="nao_iniciado">Não Iniciado</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluido">Concluído</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-6 h-6 border-4 border-bt-mid border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">ID</th>
                  <th className="table-th">Produto</th>
                  <th className="table-th">Comprador</th>
                  <th className="table-th">Produtor</th>
                  <th className="table-th">Nº Sacas</th>
                  <th className="table-th">Valor/Saca</th>
                  <th className="table-th">Valor Contrato</th>
                  <th className="table-th">Sacas Retiradas</th>
                  <th className="table-th">Comissão Proj.</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Fechamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contratos.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="table-td text-center text-gray-400 py-10">
                      Nenhum contrato encontrado
                    </td>
                  </tr>
                ) : (
                  contratos.map((c) => {
                    const calc = calcContrato(c);
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="table-td">
                          <Link href={`/contratos/${c.id}`} className="text-bt-mid font-semibold hover:underline">
                            {c.numeroId}
                          </Link>
                        </td>
                        <td className="table-td font-medium">{c.produto}</td>
                        <td className="table-td">{c.comprador.nome}</td>
                        <td className="table-td">{c.produtor.nome}</td>
                        <td className="table-td">{formatNumber(c.numSacas, 0)}</td>
                        <td className="table-td">{formatCurrency(c.valorSaca)}</td>
                        <td className="table-td font-medium">{formatCurrency(calc.valorContrato)}</td>
                        <td className="table-td">{formatNumber(calc.sacasRetiradas, 0)}</td>
                        <td className="table-td">{formatCurrency(calc.comissaoProjetada)}</td>
                        <td className="table-td"><ContratoStatusBadge status={c.status} /></td>
                        <td className="table-td text-gray-500">{formatDate(c.dataFechamento)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
