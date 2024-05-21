// src/app/backtesting/page.tsx
"use client"; // Asegura que este componente se ejecute en el cliente

import React from "react";
import { useSearchParams } from "next/navigation";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import BacktestingPage from "@/components/Backtesting/BacktestingPage";

const BacktestingHomePage: React.FC = () => {
  const searchParams = useSearchParams();
  const symbol = searchParams.get("symbol");

  return (
    <DefaultLayout>
      {symbol ? (
        <BacktestingPage symbol={symbol} />
      ) : (
        <div>
          <h1>Bienvenido a la Página de Backtesting</h1>
          <p>Por favor, selecciona un activo para comenzar.</p>
        </div>
      )}
    </DefaultLayout>
  );
};

export default BacktestingHomePage;
