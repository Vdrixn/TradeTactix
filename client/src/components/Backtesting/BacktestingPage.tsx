"use client"; // Asegura que este componente se ejecute en el cliente

import React, { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi } from "lightweight-charts";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import MultiSelect from "@/components/FormElements/MultiSelect";

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
        .catch((err) => console.error("Error fetching summary:", err));

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
          .catch((err) => console.error("Error fetching chart data:", err));

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
    <div className="flex flex-row gap-4">
      {/* Gráfico y cuadro de texto */}
      <div className="w-3/4 p-4">
        <div className="mb-4 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
            <h3 className="text-gray-200 text-xl font-medium">
              Grafico de {symbol}/USD
            </h3>
          </div>
          <div className="flex flex-col gap-5.5 p-6.5">
            <div
              id="chart"
              ref={chartContainerRef}
              style={{ height: "525px" }}
            ></div>
          </div>
        </div>

        <div className="mb-4 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
            <h3 className="text-gray-200 text-xl font-medium">
              Escribir Algoritmo
            </h3>
          </div>
          <div className="flex flex-col gap-5.5 p-6.5">
            <textarea
              rows={6}
              placeholder="Escribe tu algoritmo aquí"
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
            ></textarea>
          </div>
        </div>
      </div>

      {/* Resumen del Activo y Configuración de Backtesting */}
      <div className="w-1/4 p-4">
        <div className="mb-4 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          {/* Resumen del Activo */}
          <div>
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="text-gray-200 text-xl font-medium">
                Resumen del Activo
              </h3>
            </div>
            <div className="flex flex-col gap-5.5 border-b border-stroke p-6.5 px-6.5 py-4 dark:border-strokedark">
              {summary.name ? (
                <>
                  <p className="text-gray-400">Nombre: {summary.name}</p>
                  <p className="text-gray-400">
                    Precio: ${summary.current_price}
                  </p>
                  <p className="text-gray-400">
                    Capitalización de Mercado: ${summary.market_cap}
                  </p>
                  <p className="text-gray-400">
                    Volumen: ${summary.total_volume}
                  </p>
                  <p className="text-gray-400">
                    Máximo 24h: ${summary.high_24h}
                  </p>
                  <p className="text-gray-400">
                    Mínimo 24h: ${summary.low_24h}
                  </p>
                </>
              ) : (
                <p className="text-gray-400">Cargando...</p>
              )}
            </div>
          </div>
          {/* Configuración de Backtesting */}
          <div>
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="text-gray-200 text-xl font-medium">
                Configuración de Backtesting
              </h3>
            </div>
            <div className="flex flex-col gap-5.5 p-6.5">
              <label className="text-gray-400 mb-2 block">
                Fecha de Inicio:
                <DatePickerOne
                  value={startDate}
                  onChange={(date) => setStartDate(date)}
                  className="bg-gray-900 text-gray-200 w-full rounded border p-2"
                />
              </label>
              <label className="text-gray-400 mb-2 block">
                Fecha de Fin:
                <DatePickerOne
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                  className="bg-gray-900 text-gray-200 w-full rounded border p-2"
                />
              </label>
              <label className="text-gray-400 mb-2 block">
                Intervalo:
                <MultiSelect
                  value={interval}
                  onChange={(value) => setInterval(value)}
                  options={[
                    { value: "1m", label: "1 Minuto" },
                    { value: "15m", label: "15 Minutos" },
                    { value: "1d", label: "1 Día" },
                    { value: "7d", label: "7 Días" },
                  ]}
                  className="bg-gray-900 text-gray-200 w-full rounded border p-2"
                />
              </label>
              <button
                onClick={handleBacktest}
                className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
              >
                Iniciar Backtesting
              </button>
              <button
                className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
              >
                Crear Estrategia con IA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BacktestingPage;
