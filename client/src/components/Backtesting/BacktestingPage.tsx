"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DatePickerOne from "@/components/DatePicker/DatePickerOne";
import SelectGroupOne from "@/components/SelectGroup/SelectGroupOne";
import dynamic from "next/dynamic";
import BacktestResults from "@/components/Backtesting/BacktestResults";
import CheckboxTwo from "@/components/Checkboxes/CheckboxTwo"; // Importa el componente de resultados

const TradingViewWidget = dynamic(
  () => import("@/components/Charts/TradingViewWidget"),
  {
    ssr: false,
  },
);

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
  const symbol = searchParams.get("symbol") || "";
  const type = searchParams.get("type") || "";

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
  const [exitConditions, setExitConditions] = useState<string>(""); // Nueva variable para exit_conditions
  const [temporalidad, setTemporalidad] = useState<string>("");
  const [leverage, setLeverage] = useState<number>(1);
  const [riskRewardRatio, setRiskRewardRatio] = useState<number>(1);
  const [initialCapital, setInitialCapital] = useState<number>(1000);
  const [tradeRisk, setTradeRisk] = useState<number>(1);
  const [useAutoSlTp, setUseAutoSlTp] = useState<boolean>(false); // Nueva variable para el checkbox
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
    console.log(useAutoSlTp);
    fetch("http://127.0.0.1:8080/api/backtest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        generate_signals: algorithm,
        exit_conditions: exitConditions, // Añadir exit_conditions al cuerpo del request
        symbol: symbol,
        start_date: startDate,
        end_date: endDate,
        temporalidad: temporalidad,
        leverage: leverage,
        risk_reward_ratio: riskRewardRatio,
        initial_capital: initialCapital,
        trade_risk: tradeRisk,
        use_auto_sl_tp: useAutoSlTp ? 1 : 0, // Añadir el checkbox al cuerpo del request
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
              {typeof window !== "undefined" && (
                <TradingViewWidget symbol={symbol} indicador={type} />
              )}
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
                rows={5}
                placeholder={`**Instrucciones para Definir tu Estrategia de Trading**

Para realizar el backtesting de tu estrategia de trading, debes proporcionar dos funciones: 'generate_signals' y 'exit_conditions'. Aquí tienes los detalles y requisitos necesarios para cada una de ellas.

**Estructura del DataFrame 'data' **

El DataFrame 'data' tiene las siguientes columnas:
- 'Close': Precio de cierre.
- 'High': Precio máximo.
- 'Low': Precio mínimo.
- 'Open': Precio de apertura.

**Librerías Disponibles**
- pandas as pd
- numpy as np

**Función Obligatoria: generate_signals**

Debes definir una función llamada 'generate_signals' con la siguiente estructura:

def generate_signals(data):
    signals = pd.DataFrame(index=data.index)
    signals['positions'] = ...  # Valores > 0: posición larga, < 0: posición corta, 0: sin operación.
    signals['stop_loss'] = ...  # Opcional: valor de stop_loss.
    signals['take_profit'] = ...  # Opcional: valor de take_profit.
    return signals

**Función Opcional: exit_conditions**

Puedes definir una función llamada 'exit_conditions' para establecer condiciones personalizadas de salida de posiciones:

def exit_conditions(position, current_price, date):
    # Lógica del usuario para definir condiciones de salida.
    return ...

**Estructura del Diccionario position**

El diccionario 'position' contiene los siguientes detalles:
- 'entry_date': Fecha de entrada.
- 'entry_price': Precio de entrada.
- 'position_size': Tamaño de la posición (ajustado por apalancamiento).
- 'sl_price': Precio de stop_loss.
- 'tp_price': Precio de take_profit.
- 'direction': Dirección de la posición (1 para larga, -1 para corta).
- 'trade_amount': Cantidad invertida en la posición.
- 'leverage': Apalancamiento aplicado.

**Estructuras de Datos que Debes Devolver**

1. **generate_signals**:
   - Un DataFrame 'signals' con las columnas:
     - 'positions': Cantidad de la posición (>0 para larga, <0 para corta, 0 para no operar).
     - 'stop_loss' (opcional): Define el 'stop_loss' para cada posición.
     - 'take_profit' (opcional): Define el 'take_profit' para cada posición.

2. **exit_conditions** (opcional):
   - Un booleano que indica si se debe cerrar la posición. La función recibe:
     - 'position': Diccionario con detalles de la posición abierta.
     - 'current_price': Precio actual del activo.
     - 'date': Fecha actual.

**Ejemplo de Implementación**

generate_signals:
def generate_signals(data):
    signals = pd.DataFrame(index=data.index)
    signals['positions'] = np.where(data['Close'] > data['Open'], 1, -1)
    signals['stop_loss'] = data['Close'] * 0.95
    signals['take_profit'] = data['Close'] * 1.05
    return signals

exit_conditions (opcional):
def exit_conditions(position, current_price, date):
    return (date - position['entry_date']).days >= 5
`}
                className="w-full flex-grow rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                style={{ flexGrow: 3 }} // Ajustar la altura para ocupar 3/4
              ></textarea>
              <textarea
                rows={7}
                placeholder={`**Escribe la función exit_conditions aquí (opcional)**`}
                className="w-full flex-grow rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                value={exitConditions}
                onChange={(e) => setExitConditions(e.target.value)}
                style={{ flexGrow: 1 }} // Ajustar la altura para ocupar 1/4
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
                <div className="mb-4">
                  <CheckboxTwo
                    label="Calculo de SL y TP automático"
                    onChange={setUseAutoSlTp}
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
