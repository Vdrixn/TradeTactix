import Image from "next/image";
import { useEffect, useState } from "react";
import { Sparklines, SparklinesLine } from "react-sparklines";

const CryptoTable = () => {
  const [cryptos, setCryptos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://127.0.0.1:8080/crypto_listings?page=${currentPage}&limit=${entriesPerPage}`,
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setHasMore(data.length === entriesPerPage);
        setCryptos(data); // Aquí reemplazamos los datos existentes por los nuevos
      } catch (error) {
        console.error("There was an error!", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, entriesPerPage]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleSetEntriesPerPage = (event) => {
    setEntriesPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const renderChange = (change) => {
    const isPositive = change >= 0;
    return (
      <span style={{ color: isPositive ? "green" : "red" }}>
        {isPositive ? "↑" : "↓"} {change.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="w-full rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Listado de Criptomonedas
      </h4>

      <table className="mb-4 w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-2 dark:bg-meta-4">
            <th className="p-2.5 text-left xl:p-5">Símbolo</th>
            <th className="p-2.5 text-left xl:p-5">Nombre</th>
            <th className="p-2.5 text-left xl:p-5">Precio Actual</th>
            <th className="p-2.5 text-left xl:p-5">Cambio 24h</th>
            <th className="p-2.5 text-left xl:p-5">Cambio 7d</th>
            <th className="p-2.5 text-left xl:p-5">
              Capitalización de Mercado
            </th>
            <th className="p-2.5 text-left xl:p-5">Vista previa 7d</th>
          </tr>
        </thead>
        <tbody>
          {cryptos.map((crypto, key) => (
            <tr
              key={key}
              className="border-b border-stroke dark:border-strokedark"
            >
              <td className="flex items-center p-2.5 xl:p-5">
                <div className="mr-2 h-6 w-6 flex-shrink-0">
                  <Image
                    src={crypto.image}
                    alt={crypto.symbol}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                </div>
                <a
                  href={`http://localhost:3000/backtesting?symbol=${crypto.symbol}&type=1`}
                  className="text-blue-500 hover:underline"
                >
                  {crypto.symbol}
                </a>
              </td>
              <td className="p-2.5 xl:p-5">{crypto.name}</td>
              <td className="p-2.5 xl:p-5">${crypto.current_price}</td>
              <td className="p-2.5 xl:p-5">
                {renderChange(crypto.price_change_24h)}
              </td>
              <td className="p-2.5 xl:p-5">
                {renderChange(crypto.price_change_7d)}
              </td>
              <td className="p-2.5 xl:p-5">${crypto.market_cap}</td>
              <td className="whitespace-nowrap p-2.5 xl:p-5">
                <Sparklines data={crypto.sparkline}>
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
          onChange={(e) => setEntriesPerPage(Number(e.target.value))}
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
          disabled={!hasMore || loading}
        >
          Siguiente &raquo;
        </button>
      </div>
    </div>
  );
};

export default CryptoTable;
