"use client";
import DashboardLayout from "../dashboard-layout";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

const LIMIT = 20;

interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string;
  tipo: string;
  telefone?: string;
  email?: string;
  cidade?: string;
  estado?: string;
}

const tipoLabel: Record<string, string> = {
  produtor: "Produtor",
  comprador: "Comprador",
  ambos: "Prod. e Comp.",
};

export default function ClientesPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  async function load(p = page) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tipo) params.set("tipo", tipo);
    params.set("page", String(p));
    params.set("limit", String(LIMIT));
    try {
      const res = await apiFetch(`/clientes?${params}`);
      const data = await res.json();
      setClientes(Array.isArray(data.data) ? data.data : []);
      if (data.meta) setMeta({ total: data.meta.total, totalPages: data.meta.totalPages });
    } catch {
      setClientes([]);
    }
    setLoading(false);
  }

  useEffect(() => { setPage(1); }, [q, tipo]);
  useEffect(() => { load(page); }, [q, tipo, page]);

  async function handleDelete(id: string) {
    if (!confirm("Excluir este cliente?")) return;
    setDeletingId(id);
    await apiFetch(`/clientes/${id}`, { method: "DELETE" });
    setDeletingId(null);
    load();
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Clientes"
        subtitle={`${meta.total} clientes`}
        action={isAdmin ? { label: "Novo Cliente", href: "/clientes/novo" } : undefined}
      />

      <div className="card">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            className="input sm:w-64"
            placeholder="Buscar por nome ou CPF/CNPJ..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="input sm:w-48"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">Todos os tipos</option>
            <option value="produtor">Produtores</option>
            <option value="comprador">Compradores</option>
            <option value="ambos">Ambos</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-6 h-6 border-4 border-bt-mid border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">Nome</th>
                  <th className="table-th">CPF/CNPJ</th>
                  <th className="table-th">Tipo</th>
                  <th className="table-th">Cidade</th>
                  <th className="table-th">Telefone</th>
                  {isAdmin && <th className="table-th">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-td text-center text-gray-400 py-10">
                      Nenhum cliente encontrado
                    </td>
                  </tr>
                ) : (
                  clientes.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="table-td font-medium">{c.nome}</td>
                      <td className="table-td text-gray-500">{c.cpfCnpj}</td>
                      <td className="table-td">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          c.tipo === "produtor" ? "bg-green-100 text-green-700" :
                          c.tipo === "comprador" ? "bg-blue-100 text-blue-700" :
                          "bg-purple-100 text-purple-700"
                        }`}>
                          {tipoLabel[c.tipo] || c.tipo}
                        </span>
                      </td>
                      <td className="table-td text-gray-500">{c.cidade || "-"}{c.estado ? ` - ${c.estado}` : ""}</td>
                      <td className="table-td text-gray-500">{c.telefone || "-"}</td>
                      {isAdmin && (
                        <td className="table-td">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/clientes/${c.id}`}
                              className="text-bt-mid hover:text-bt-dark text-xs font-medium"
                            >
                              Editar
                            </Link>
                            <button
                              onClick={() => handleDelete(c.id)}
                              disabled={deletingId === c.id}
                              className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={LIMIT} onPageChange={setPage} />
      </div>
    </DashboardLayout>
  );
}
