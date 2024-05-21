"use client"; // Asegura que este componente se ejecute en el cliente

import React, { useState, useEffect, useRef } from "react";
import { createChart, IChartApi, ISeriesApi } from "lightweight-charts";

interface BacktestingPageProps {
  symbol: string;
}

interface Summary {
  name?: string;
  current_price?: number;
  market_cap?: number;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
}

interface ChartData {
  time: string;
  value: number;
}

const BacktestingPage: React.FC<BacktestingPageProps> = ({ symbol }) => {
  const [summary, setSummary] = useState<Summary>({});
  const [algorithm, setAlgorithm] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("2023-05-14");
  const [endDate, setEndDate] = useState<string>("2024-05-14");
  const [interval, setInterval] = useState<string>("1d");
  const [backtestResults, setBacktestResults] = useState<string | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (symbol) {
      fetch(`http://127.0.0.1:8080/api/summary?symbol=${symbol}`)
        .then((res) => res.json())
        .then((data) => setSummary(data))
        .catch((err) => console.error(err));

      if (chartRef.current) {
        chartRef.current.remove();
      }

      const chartContainer = chartContainerRef.current;
      if (chartContainer) {
        const chart: IChartApi = createChart(chartContainer, {
          width: chartContainer.clientWidth,
          height: chartContainer.clientHeight,
        });
        chartRef.current = chart;

        const lineSeries: ISeriesApi<"Line"> = chart.addLineSeries();

        fetch(
          `http://127.0.0.1:8080/api/chart?symbol=${symbol}&interval=${interval}&start_date=${startDate}&end_date=${endDate}`,
        )
          .then((res) => res.json())
          .then((data: ChartData[]) => {
            lineSeries.setData(data);
          })
          .catch((err) => console.error(err));

        const handleResize = () => {
          if (chartContainer && chartRef.current) {
            chartRef.current.applyOptions({
              width: chartContainer.clientWidth,
              height: chartContainer.clientHeight,
            });
          }
        };

        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
        };
      }
    }
  }, [symbol, interval, startDate, endDate]);

  const handleBacktest = () => {
    fetch("http://127.0.0.1:8080/api/backtest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        algorithm,
        symbol,
        start_date: startDate,
        end_date: endDate,
        interval,
      }),
    })
      .then((res) => res.json())
      .then((data) => setBacktestResults(data.results))
      .catch((err) => console.error(err));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-gray-200 mb-4 text-2xl font-bold">
        Backtesting de Algoritmos para {symbol}
      </h1>
      <div className="-mx-4 flex flex-wrap">
        <div className="mb-4 w-full px-4 lg:w-2/3">
          <div
            id="chart"
            ref={chartContainerRef}
            className="bg-gray-800 rounded-lg p-4 shadow-md"
            style={{ height: "400px" }}
          ></div>
        </div>
        <div className="mb-4 w-full px-4 lg:w-1/3">
          <div className="bg-gray-800 rounded-lg p-4 shadow-md">
            <h2 className="text-gray-200 mb-2 text-xl font-bold">
              Resumen del Activo
            </h2>
            <p className="text-gray-400">Nombre: {summary.name}</p>
            <p className="text-gray-400">Precio: {summary.current_price}</p>
            <p className="text-gray-400">
              Capitalización de Mercado: {summary.market_cap}
            </p>
            <p className="text-gray-400">Volumen: {summary.total_volume}</p>
            <p className="text-gray-400">Máximo 24h: {summary.high_24h}</p>
            <p className="text-gray-400">Mínimo 24h: {summary.low_24h}</p>
          </div>
        </div>
      </div>
      <div className="-mx-4 flex flex-wrap">
        <div className="mb-4 w-full px-4 lg:w-2/3">
          <div className="bg-gray-800 rounded-lg p-4 shadow-md">
            <h2 className="text-gray-200 mb-2 text-xl font-bold">
              Escribir Algoritmo
            </h2>
            <textarea
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              rows={10}
              className="bg-gray-900 text-gray-200 w-full rounded border p-2"
            />
          </div>
        </div>
        <div className="mb-4 w-full px-4 lg:w-1/3">
          <div className="bg-gray-800 rounded-lg p-4 shadow-md">
            <h2 className="text-gray-200 mb-2 text-xl font-bold">
              Configuración de Backtesting
            </h2>
            <label className="text-gray-400 mb-2 block">
              Fecha de Inicio:
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-900 text-gray-200 w-full rounded border p-2"
              />
            </label>
            <label className="text-gray-400 mb-2 block">
              Fecha de Fin:
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-900 text-gray-200 w-full rounded border p-2"
              />
            </label>
            <label className="text-gray-400 mb-2 block">
              Intervalo:
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="bg-gray-900 text-gray-200 w-full rounded border p-2"
              >
                <option value="1m">1 Minuto</option>
                <option value="15m">15 Minutos</option>
                <option value="1d">1 Día</option>
                <option value="7d">7 Días</option>
              </select>
            </label>
            <button
              onClick={handleBacktest}
              className="mt-4 w-full rounded bg-blue-500 p-2 text-white"
            >
              Iniciar Backtesting
            </button>
          </div>
        </div>
      </div>
      {backtestResults && (
        <div className="bg-gray-800 rounded-lg p-4 shadow-md">
          <h2 className="text-gray-200 mb-2 text-xl font-bold">
            Resultados del Backtesting
          </h2>
          <pre className="text-gray-400">{backtestResults}</pre>
        </div>
      )}
    </div>
  );
};

export default BacktestingPage;
