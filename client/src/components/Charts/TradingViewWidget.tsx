import React, { useEffect, useRef, memo } from "react";

function TradingViewWidget({ symbol, indicador }) {
  const container = useRef(null);

  useEffect(() => {
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
        formattedSymbol = `FX:${symbol}`;
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
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    containerElement.appendChild(script);

    return () => {
      containerElement.innerHTML = ""; // Limpia el script al desmontar el componente
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
      <div className="tradingview-widget-copyright">
        <a
          href="https://www.tradingview.com/"
          rel="noopener nofollow"
          target="_blank"
        >
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
