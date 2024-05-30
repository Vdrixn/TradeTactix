const Chart: React.FC<ChartProps> = ({ symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [interval, setInterval] = useState("1D");

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chartContainer = chartContainerRef.current;
    if (chartContainer) {
      const chart: IChartApi = createChart(chartContainer, {
        width: chartContainer.clientWidth,
        height: chartContainer.clientHeight,
        timeScale: {
          timeVisible: true,
          secondsVisible: true,
        },
        crosshair: {
          mode: 0, // LightweightCharts.CrosshairMode.Normal
        },
      });
      chartRef.current = chart;

      const candleSeries: ISeriesApi<"Candlestick"> =
        chart.addCandlestickSeries();

      fetch(
        `http://127.0.0.1:8080/api/chart?symbol=${symbol}&interval=${interval}`,
      )
        .then((res) => res.json())
        .then((data: CandleData[]) => {
          const formattedData = data.map((item) => ({
            ...item,
            time: item.time as UTCTimestamp, // Convertir a UTCTimestamp
          }));
          candleSeries.setData(formattedData);
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
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    }
  }, [symbol, interval]);

  const buttonStyles = {
    padding: "8px 8px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "transparent",
  };

  const selectedButtonStyles = {
    ...buttonStyles,
    color: "#3c50e0",
  };

  const containerStyles = {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
  };

  return (
    <div className="flex flex-col gap-2">
      <div ref={chartContainerRef} style={{ height: "525px" }} />
      <div style={containerStyles}>
        <button
          style={interval === "15m" ? selectedButtonStyles : buttonStyles}
          onClick={() => setInterval("15m")}
        >
          15m
        </button>
        <button
          style={interval === "30m" ? selectedButtonStyles : buttonStyles}
          onClick={() => setInterval("30m")}
        >
          30m
        </button>
        <button
          style={interval === "1h" ? selectedButtonStyles : buttonStyles}
          onClick={() => setInterval("1h")}
        >
          1h
        </button>
        <button
          style={interval === "1D" ? selectedButtonStyles : buttonStyles}
          onClick={() => setInterval("1D")}
        >
          1D
        </button>
      </div>
    </div>
  );
};

export default Chart;
