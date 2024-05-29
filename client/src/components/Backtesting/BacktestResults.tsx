import React from "react";
import CardDataStats from "@/components/CardDataStats";
import ChartOne from "@/components/Charts/ChartOne";

interface BacktestResultsProps {
  results: {
    summary: {
      final_capital: number;
      unrealized_pnl: number;
      num_positions: number;
      num_trades: number;
      winning_trades: number;
      losing_trades: number;
      max_drawdown: number;
      max_increase: number;
      average_duration: number;
    };
    signals: any;
    portfolio: any;
  };
}

const BacktestResults: React.FC<BacktestResultsProps> = ({ results }) => {
  const summary = results.summary;

  const portfolioData = Object.keys(results.portfolio.total).map((key) => ({
    time: key, // Mantener la fecha como string ISO
    value: results.portfolio.total[key],
  }));

  const holdData = Object.keys(results.portfolio.hold).map((key) => ({
    time: key, // Mantener la fecha como string ISO
    value: results.portfolio.hold[key],
  }));

  const filteredSignalKeys = Object.keys(results.signals.price).filter(
    (key) => results.signals.signal?.[key] !== 0,
  );

  const filteredSignals = filteredSignalKeys.filter(
    (key) =>
      results.signals.positions[key] > 0 || results.signals.positions[key] < 0,
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="text-gray-200 text-xl font-medium">
          Resultados del Backtesting
        </h3>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <CardDataStats
            title="Capital Final"
            total={`$${summary.final_capital.toFixed(2)}`}
            className="flex-1 rounded-sm border border-stroke p-4 shadow-default dark:border-strokedark dark:bg-boxdark"
          >
            <span className="text-black dark:text-white">💰</span>
          </CardDataStats>
          <CardDataStats
            title="Capital Invertido"
            total={`$${summary.unrealized_pnl.toFixed(2)}`}
            className="flex-1 rounded-sm border border-stroke p-4 shadow-default dark:border-strokedark dark:bg-boxdark"
          >
            <span className="text-black dark:text-white">💹</span>
          </CardDataStats>
          <CardDataStats
            title="Total"
            total={`$${(summary.final_capital + summary.unrealized_pnl).toFixed(2)}`}
            className="flex-1 rounded-sm border border-stroke p-4 shadow-default dark:border-strokedark dark:bg-boxdark"
          >
            <span className="text-black dark:text-white">📈</span>
          </CardDataStats>
          <CardDataStats
            title="Posiciones Abiertas"
            total={`${summary.num_positions}`}
            className="flex-1 rounded-sm border border-stroke p-4 shadow-default dark:border-strokedark dark:bg-boxdark"
          >
            <span className="text-black dark:text-white">🛒</span>
          </CardDataStats>
          <CardDataStats
            title="Total de Transacciones"
            total={`${summary.num_trades}`}
            className="flex-1 rounded-sm border border-stroke p-4 shadow-default dark:border-strokedark dark:bg-boxdark"
          >
            <span className="text-black dark:text-white">💵</span>
          </CardDataStats>
          <CardDataStats
            title="Transacciones Ganadoras"
            total={`${summary.winning_trades}`}
            className="flex-1 rounded-sm border border-stroke p-4 shadow-default dark:border-strokedark dark:bg-boxdark"
          >
            <span className="text-black dark:text-white">🏆</span>
          </CardDataStats>
          <CardDataStats
            title="Transacciones Perdedoras"
            total={`${summary.losing_trades}`}
            className="flex-1 rounded-sm border border-stroke p-4 shadow-default dark:border-strokedark dark:bg-boxdark"
          >
            <span className="text-black dark:text-white">💔</span>
          </CardDataStats>
          <CardDataStats
            title="Duración Promedio de Operaciones"
            total={`${summary.average_duration.toFixed(2)} días`}
            className="flex-1 rounded-sm border border-stroke p-4 shadow-default dark:border-strokedark dark:bg-boxdark"
          >
            <span className="text-black dark:text-white">⏱️</span>
          </CardDataStats>
          <CardDataStats
            title="Máximo Decrecimiento"
            total={`${(summary.max_drawdown * 100).toFixed(2)}%`}
            className="flex-1 rounded-sm border border-stroke p-4 shadow-default dark:border-strokedark dark:bg-boxdark"
          >
            <span className="text-black dark:text-white">📉</span>
          </CardDataStats>
          <CardDataStats
            title="Máximo Incremento"
            total={`${(summary.max_increase * 100).toFixed(2)}%`}
            className="flex-1 rounded-sm border border-stroke p-4 shadow-default dark:border-strokedark dark:bg-boxdark"
          >
            <span className="text-black dark:text-white">📈</span>
          </CardDataStats>
        </div>
      </div>

      <div className="mt-4">
        <ChartOne portfolioData={portfolioData} holdData={holdData} />
      </div>

      <div className="mt-4 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div>
          <h4 className="text-lg font-semibold">Señales</h4>
          <div className="max-h-64 overflow-y-auto">
            <table className="min-w-full divide-y divide-stroke">
              <thead className="sticky top-0 bg-gray dark:bg-form-input dark:text-white">
                <tr>
                  <th className="text-gray-500 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="text-gray-500 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="text-gray-500 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    SL
                  </th>
                  <th className="text-gray-500 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    TP
                  </th>
                  <th className="text-gray-500 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    Señal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke bg-white dark:bg-form-input dark:text-white">
                {filteredSignals.map((key, index) => (
                  <tr key={index}>
                    <td className="text-gray-500 whitespace-nowrap px-4 py-2 text-sm">
                      {key}
                    </td>
                    <td className="text-gray-500 whitespace-nowrap px-4 py-2 text-sm">
                      {results.signals.price[key]?.toFixed(2) || "-"}
                    </td>
                    <td className="text-gray-500 whitespace-nowrap px-4 py-2 text-sm">
                      {results.signals.sl_price[key]?.toFixed(2) || "-"}
                    </td>
                    <td className="text-gray-500 whitespace-nowrap px-4 py-2 text-sm">
                      {results.signals.tp_price[key]?.toFixed(2) || "-"}
                    </td>
                    <td className="text-gray-500 whitespace-nowrap px-4 py-2 text-sm">
                      {results.signals.positions[key] > 0
                        ? "Largo"
                        : results.signals.positions[key] < 0
                          ? "Corto"
                          : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-lg font-semibold">Portafolio</h4>
          <div className="max-h-64 overflow-y-auto">
            <table className="min-w-full divide-y divide-stroke">
              <thead className="sticky top-0 bg-gray dark:bg-form-input dark:text-white">
                <tr>
                  <th className="text-gray-500 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="text-gray-500 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    Posiciones
                  </th>
                  <th className="text-gray-500 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    Efectivo
                  </th>
                  <th className="text-gray-500 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-gray-500 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    Retornos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke bg-white dark:bg-form-input dark:text-white">
                {Object.keys(results.portfolio.positions).map((key, index) => (
                  <tr key={index}>
                    <td className="text-gray-500 whitespace-nowrap px-4 py-2 text-sm">
                      {key}
                    </td>
                    <td className="text-gray-500 whitespace-nowrap px-4 py-2 text-sm">
                      {results.portfolio.positions[key]?.toFixed(2) || "-"}
                    </td>
                    <td className="text-gray-500 whitespace-nowrap px-4 py-2 text-sm">
                      {results.portfolio.cash[key]?.toFixed(2) || "-"}
                    </td>
                    <td className="text-gray-500 whitespace-nowrap px-4 py-2 text-sm">
                      {results.portfolio.total[key]?.toFixed(2) || "-"}
                    </td>
                    <td className="text-gray-500 whitespace-nowrap px-4 py-2 text-sm">
                      {(results.portfolio.returns[key] * 100).toFixed(2) || "-"}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BacktestResults;
