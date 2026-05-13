export function ContratoStatusBadge({ status }: { status: string }) {
  if (status === "em_andamento")
    return (
      <span className="badge badge-blue">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
        Em Andamento
      </span>
    );
  if (status === "concluido")
    return (
      <span className="badge badge-green">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
        Concluído
      </span>
    );
  return (
    <span className="badge badge-gray">
      <span className="w-1.5 h-1.5 rounded-full bg-ink-4 flex-shrink-0" />
      Não Iniciado
    </span>
  );
}

export function TransacaoStatusBadge({ status }: { status: string }) {
  if (status === "pago")
    return (
      <span className="badge badge-green">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
        Pago
      </span>
    );
  if (status === "cancelado")
    return (
      <span className="badge badge-red">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
        Cancelado
      </span>
    );
  return (
    <span className="badge badge-yellow">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
      Pendente
    </span>
  );
}
