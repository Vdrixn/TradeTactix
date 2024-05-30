"use client"; // Ensure this component runs on the client

import React from "react";
import { useSearchParams } from "next/navigation";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import dynamic from "next/dynamic";

// Dynamically import BacktestingPage component to prevent SSR issues
const BacktestingPage = dynamic(
  () => import("@/components/Backtesting/BacktestingPage"),
  { ssr: false },
);
const BacktestingPage1 = dynamic(
  () => import("@/components/Backtesting/BacktestingPage1"),
  { ssr: false },
);

const BacktestingHomePage: React.FC = () => {
  const searchParams = useSearchParams();
  const symbol = searchParams.get("symbol");

  return (
    <DefaultLayout>
      {symbol ? (
        <BacktestingPage />
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
