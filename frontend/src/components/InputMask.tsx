"use client";

import React from "react";

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string | number;
  onChange: (value: string) => void;
}

/**
 * Input para valores monetários com máscara 0,00 começando pelos decimais
 */
export function MoneyInput({ value, onChange, ...props }: MoneyInputProps) {
  const displayValue = formatMoney(value);

  function formatMoney(val: string | number) {
    const n = typeof val === "number" ? val : parseFloat(val || "0");
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleanValue = e.target.value.replace(/\D/g, "");
    if (!cleanValue) {
      onChange("0");
      return;
    }
    const floatValue = (parseInt(cleanValue, 10) / 100).toString();
    onChange(floatValue);
  }

  return (
    <input
      {...props}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={(e) => e.target.select()}
    />
  );
}

/**
 * Máscara para CPF ou CNPJ
 */
export function CpfCnpjInput({ value, onChange, ...props }: MoneyInputProps) {
  function mask(val: string) {
    const v = val.replace(/\D/g, "").slice(0, 14);
    if (v.length <= 11) {
      // CPF: 000.000.000-00
      return v
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      // CNPJ: 00.000.000/0000-00
      return v
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
  }

  return (
    <input
      {...props}
      type="text"
      value={mask(String(value))}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
    />
  );
}
