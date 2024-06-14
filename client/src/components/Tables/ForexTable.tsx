"use client";

import { useEffect, useState } from "react";
import { Sparklines, SparklinesLine } from "react-sparklines";

// Definir la interfaz para los datos de pares de divisas
interface ForexData {
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_7d: number;
  sparkline: number[];
}

const ForexTable: React.FC = () => {
  const [forex, setForex] = useState<ForexData[]>([]);
  const [filteredForex, setFilteredForex] = useState<ForexData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://127.0.0.1:8080/forex_listings`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data: ForexData[] = await response.json();
        setForex(data);
        setFilteredForex(data);
      } catch (error) {
        console.error("There was an error!", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every 1 minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    const filteredData = forex.filter((pair) =>
      pair.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredForex(filteredData);
  }, [searchTerm, forex]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage * entriesPerPage < filteredForex.length) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleSetEntriesPerPage = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setEntriesPerPage(Number(event.target.value));
    setCurrentPage(1); // Reiniciar la página a la primera cuando cambia el límite
  };

  const renderChange = (change: number) => {
    if (typeof change !== "number" || isNaN(change)) return "-";
    const isPositive = change >= 0;
    return (
      <span style={{ color: isPositive ? "green" : "red" }}>
        {isPositive ? "↑" : "↓"} {change.toFixed(2)}%
      </span>
    );
  };

  const indexOfLastForex = currentPage * entriesPerPage;
  const indexOfFirstForex = indexOfLastForex - entriesPerPage;
  const currentForex = filteredForex.slice(indexOfFirstForex, indexOfLastForex);

  return (
    <div className="w-full rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Lista de Forex
      </h4>
      <div className="mb-4 flex items-center justify-between border-b pb-4">
        <div className="sm:block">
          <form>
            <div className="relative">
              <button
                type="button"
                className="absolute left-0 top-1/2 -translate-y-1/2"
              >
                <svg
                  className="fill-body hover:fill-primary dark:fill-bodydark dark:hover:fill-primary"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9.16666 3.33332C5.945 3.33332 3.33332 5.945 3.33332 9.16666C3.33332 12.3883 5.945 15 9.16666 15C12.3883 15 15 12.3883 15 9.16666C15 5.945 12.3883 3.33332 9.16666 3.33332ZM1.66666 9.16666C1.66666 5.02452 5.02452 1.66666 9.16666 1.66666C13.3088 1.66666 16.6667 5.02452 16.6667 9.16666C16.6667 13.3088 13.3088 16.6667 9.16666 16.6667C5.02452 16.6667 1.66666 13.3088 1.66666 9.16666Z"
                    fill=""
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M13.2857 13.2857C13.6112 12.9603 14.1388 12.9603 14.4642 13.2857L18.0892 16.9107C18.4147 17.2362 18.4147 17.7638 18.0892 18.0892C17.7638 18.4147 17.2362 18.4147 16.9107 18.0892L13.2857 14.4642C12.9603 14.1388 12.9603 13.6112 13.2857 13.2857Z"
                    fill=""
                  />
                </svg>
              </button>

              <input
                type="text"
                placeholder="Buscar en el listado..."
                className="w-full bg-transparent pl-9 pr-4 font-medium focus:outline-none xl:w-125"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center">Cargando datos...</div>
      ) : (
        <>
          <table className="mb-4 w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-2 dark:bg-meta-4">
                <th className="p-2.5 text-left xl:p-5">Divisas</th>
                <th className="p-2.5 text-left xl:p-5">Precio Actual</th>
                <th className="p-2.5 text-left xl:p-5">Cambio 24h</th>
                <th className="p-2.5 text-left xl:p-5">Cambio 7d</th>
                <th className="p-2.5 text-left xl:p-5">Vista 7d</th>
              </tr>
            </thead>
            <tbody>
              {currentForex.map((forexPair, key) => (
                <tr
                  key={key}
                  className="border-b border-stroke dark:border-strokedark"
                >
                  <td className="flex items-center p-2.5 xl:p-5">
                    <a
                      href={`http://localhost:3000/backtesting?symbol=${forexPair.name}&type=3`}
                      className="text-blue-500 hover:underline"
                    >
                      {forexPair.name}
                    </a>
                  </td>
                  <td className="p-2.5 xl:p-5">{forexPair.current_price}</td>
                  <td className="p-2.5 xl:p-5">
                    {renderChange(forexPair.price_change_24h)}
                  </td>
                  <td className="p-2.5 xl:p-5">
                    {renderChange(forexPair.price_change_7d)}
                  </td>
                  <td className="whitespace-nowrap p-2.5 xl:p-5">
                    <Sparklines data={forexPair.sparkline}>
                      <SparklinesLine color="green" />
                    </Sparklines>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mb-2 flex items-center justify-center space-x-3">
            <select
              className="border-gray-300 rounded-md border px-2 py-1"
              value={entriesPerPage}
              onChange={handleSetEntriesPerPage}
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="25">25</option>
            </select>
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50 lg:px-5 xl:px-6"
              onClick={handlePrevPage}
              disabled={currentPage === 1 || loading}
            >
              &laquo; Anterior
            </button>
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50 lg:px-5 xl:px-6"
              onClick={handleNextPage}
              disabled={
                currentPage * entriesPerPage >= filteredForex.length || loading
              }
            >
              Siguiente &raquo;
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ForexTable;
