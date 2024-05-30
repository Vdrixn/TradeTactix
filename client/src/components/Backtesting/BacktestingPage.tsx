import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DatePickerOne from "@/components/DatePicker/DatePickerOne";
import SelectGroupOne from "@/components/SelectGroup/SelectGroupOne";
import TradingViewWidget from "@/components/Charts/TradingViewWidget";
import BacktestResults from "@/components/Backtesting/BacktestResults"; // Importa el componente de resultados

interface Summary {
  name?: string;
  current_price?: number;
  market_cap?: number;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const BacktestingPage: React.FC = () => {
  const searchParams = useSearchParams();
  const symbol = searchParams.get("symbol");
  const type = searchParams.get("type");

  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  const fourYearsAgo = new Date();
  fourYearsAgo.setFullYear(today.getFullYear() - 4);

  const [startDate, setStartDate] = useState<string>(formatDate(oneYearAgo));
  const [endDate, setEndDate] = useState<string>(formatDate(today));
  const [minDate, setMinDate] = useState<string>(formatDate(fourYearsAgo));
  const [summary, setSummary] = useState<Summary>({});
  const [algorithm, setAlgorithm] = useState<string>("");
  const [temporalidad, setTemporalidad] = useState<string>("");
  const [leverage, setLeverage] = useState<number>(1);
  const [riskRewardRatio, setRiskRewardRatio] = useState<number>(1);
  const [initialCapital, setInitialCapital] = useState<number>(1000);
  const [tradeRisk, setTradeRisk] = useState<number>(1);
  const [backtestResults, setBacktestResults] = useState<any | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>("");

  useEffect(() => {
    if (symbol) {
      fetch(`http://127.0.0.1:8080/api/summary?symbol=${symbol}`)
        .then((res) => res.json())
        .then((data) => setSummary(data))
        .catch((err) => console.error("Error fetching summary:", err));
    }
  }, [symbol]);

  const handleTempChange = (temp: string) => {
    setTemporalidad(temp);
    const today = new Date();
    const newDate = new Date();
    switch (temp) {
      case "15m":
        newDate.setDate(today.getDate() - 59);
        break;
      case "30m":
        newDate.setDate(today.getDate() - 59);
        break;
      case "1h":
        newDate.setDate(today.getDate() - 729);
        break;
      case "1D":
        newDate.setDate(today.getDate() - 1460);
        break;
      default:
        break;
    }
    setMinDate(formatDate(newDate));
    setStartDate(formatDate(newDate));
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
  };

  const handleBacktest = () => {
    if (!temporalidad) {
      setAlertMessage(
        "Selecciona una temporalidad antes de iniciar el backtest.",
      );
      setShowAlert(true);
      return;
    }
    if (!algorithm) {
      setAlertMessage("Escribe un algoritmo antes de iniciar el backtest.");
      setShowAlert(true);
      return;
    }
    setShowAlert(false);
    fetch("http://127.0.0.1:8080/api/backtest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        algorithm: algorithm,
        symbol: symbol,
        start_date: startDate,
        end_date: endDate,
        temporalidad: temporalidad,
        leverage: leverage,
        risk_reward_ratio: riskRewardRatio,
        initial_capital: initialCapital,
        trade_risk: tradeRisk,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setAlertMessage(data.error);
          setShowAlert(true);
        } else {
          setBacktestResults(data);
          setShowAlert(false);
        }
      })
      .catch((err) => {
        setAlertMessage("Error realizando el backtest");
        setShowAlert(true);
        console.error(err);
      });
  };

  return (
    <div className="flex flex-col">
      {showAlert && (
        <div className="flex w-full border-l-6 border-[#F87171] bg-[#F87171] bg-opacity-[15%] px-7 py-8 shadow-md dark:bg-[#1B1B24] dark:bg-opacity-30 md:p-9">
          <div className="mr-5 flex h-9 w-full max-w-[36px] items-center justify-center rounded-lg bg-[#F87171]">
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.4917 7.65579L11.106 12.2645C11.2545 12.4128 11.4715 12.5 11.6738 12.5C11.8762 12.5 12.0931 12.4128 12.2416 12.2645C12.5621 11.9445 12.5623 11.4317 12.2423 11.1114C12.2422 11.1113 12.2422 11.1113 12.2422 11.1113C12.242 11.1111 12.2418 11.1109 12.2416 11.1107L7.64539 6.50351L12.2589 1.91221L12.2595 1.91158C12.5802 1.59132 12.5802 1.07805 12.2595 0.757793C11.9393 0.437994 11.4268 0.437869 11.1064 0.757418C11.1063 0.757543 11.1062 0.757668 11.106 0.757793L6.49234 5.34931L1.89459 0.740581L1.89396 0.739942C1.57364 0.420019 1.0608 0.420019 0.740487 0.739944C0.42005 1.05999 0.419837 1.57279 0.73985 1.89309L6.4917 7.65579ZM6.4917 7.65579L1.89459 12.2639L1.89395 12.2645C1.74546 12.4128 1.52854 12.5 1.32616 12.5C1.12377 12.5 0.906853 12.4128 0.758361 12.2645L1.1117 11.9108L0.758358 12.2645C0.437984 11.9445 0.437708 11.4319 0.757539 11.1116C0.757812 11.1113 0.758086 11.111 0.75836 11.1107L5.33864 6.50287L0.740487 1.89373L6.4917 7.65579Z"
                fill="#ffffff"
                stroke="#ffffff"
              ></path>
            </svg>
          </div>
          <div className="w-full">
            <h5 className="mb-3 font-semibold text-[#B45454]">
              {alertMessage}
            </h5>
          </div>
        </div>
      )}

      <div className="flex flex-row">
        <div className="w-full p-4">
          <div className="mb-4 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="text-gray-200 text-xl font-medium">
                Gráfico de {symbol}
              </h3>
            </div>
            <div
              className="flex flex-col gap-5.5 p-6.5"
              style={{ height: "550px" }}
            >
              <TradingViewWidget symbol={symbol} indicador={type} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-row">
        <div className="w-3/4 p-4">
          <div
            className="mb-4 flex flex-col justify-between rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
            style={{ minHeight: "100%" }}
          >
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="text-gray-200 text-xl font-medium">
                Escribir Algoritmo
              </h3>
            </div>
            <div className="flex flex-grow flex-col gap-5.5 p-6.5">
              <textarea
                rows={6}
                placeholder={`El Algoritmo debe incluir únicamente la funcion generate_signals(data) que recibe un DataFrame con los precios. Debe retornar un DataFrame.

Requisitos Obligatorios:
1. Definición de la función:
def generate_signals(data):

2. Creación de la estructura de datos:
signals = pd.DataFrame(index=data.index)

3. Columna obligatoria 'positions':
signals['positions'] = ...
- Valores > 0: posición larga (compra).
- Valores < 0: posición corta (venta).
- Valores = 0: sin operación.

4. Devolución del DataFrame:
return signals

Están disponibles las siguientes siguientes librerías:
- pandas as pd
- numpy as np

La estructura del DataFrame 'data' es la siguiente:
- Columna 'Close': precio de cierre.
- Columna 'High': precio máximo.
- Columna 'Low': precio mínimo.
- Columna 'Open': precio de apertura.`}
                className="w-full flex-grow rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
              ></textarea>
            </div>
          </div>
        </div>

        <div className="w-1/4 p-4">
          <div
            className="mb-4 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
            style={{ height: "100%" }}
          >
            <div>
              <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                <h3 className="text-gray-200 text-xl font-medium">
                  Configuración de Backtesting
                </h3>
              </div>
              <div className="flex flex-col gap-5.5 p-6.5">
                <div className="text-gray-400 block">
                  Temporalidades:
                  <SelectGroupOne onChange={handleTempChange} />
                </div>
                <div className="text-gray-400 block">
                  <h2>Fecha de Inicio:</h2>
                  <DatePickerOne
                    initialDate={startDate}
                    onChange={handleStartDateChange}
                    minDate={minDate}
                    maxDate={formatDate(today)}
                  />
                </div>
                <div className="text-gray-400 block">
                  <h2>Fecha de Fin:</h2>
                  <DatePickerOne
                    initialDate={endDate}
                    onChange={handleEndDateChange}
                    minDate={startDate}
                    maxDate={formatDate(today)}
                  />
                </div>
                <div className="text-gray-400 block">
                  <h2>Apalancamiento:</h2>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={leverage}
                    onChange={(e) => setLeverage(Number(e.target.value))}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div className="text-gray-400 block">
                  <h2>Ratio Riesgo:Beneficio:</h2>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={riskRewardRatio}
                    onChange={(e) => setRiskRewardRatio(Number(e.target.value))}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div className="text-gray-400 block">
                  <h2>Capital Inicial:</h2>
                  <input
                    type="number"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Number(e.target.value))}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div className="text-gray-400 block">
                  <h2>% por operación:</h2>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={tradeRisk}
                    onChange={(e) => setTradeRisk(Number(e.target.value))}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
                <button
                  onClick={handleBacktest}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                >
                  Iniciar Backtesting
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {backtestResults && <BacktestResults results={backtestResults} />}
    </div>
  );
};

export default BacktestingPage;
