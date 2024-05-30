import React, { useEffect, useRef } from "react";

interface TradingViewWidgetProps {
  symbol: string;
  indicador: string;
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  symbol,
  indicador,
}) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const containerElement = container.current;

    let formattedSymbol;
    switch (indicador) {
      case "1":
        formattedSymbol = `BINANCE:${symbol}USDT`;
        break;
      case "2":
        formattedSymbol = `NASDAQ:${symbol}`;
        break;
      case "3":
        formattedSymbol = `FX:${symbol.replace("/", "")}`;
        break;
      default:
        formattedSymbol = symbol;
    }

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: formattedSymbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      hide_side_toolbar: false,
      allow_symbol_change: false,
      details: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    containerElement?.appendChild(script);

    return () => {
      containerElement?.innerHTML = ""; // Limpia el script al desmontar el componente
    };
  }, [symbol, indicador]);

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ height: "700px", width: "100%" }} // Ajusta la altura aquí
    >
      <div
        className="tradingview-widget-container__widget"
        style={{ height: "100%", width: "100%" }}
      ></div>
    </div>
  );
};

export default TradingViewWidget;
