"use client"; // Asegura que este componente se ejecute en el cliente

import React from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import BacktestingPage from "@/components/Backtesting/BacktestingPage";
import BacktestingPage1 from "@/components/Backtesting/BacktestingPage1";

const BacktestingHomePage: React.FC = () => {

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
