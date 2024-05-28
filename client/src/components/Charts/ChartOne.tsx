import { ApexOptions } from "apexcharts";
import React from "react";
import ReactApexChart from "react-apexcharts";

interface ChartOneProps {
  portfolioData: { time: string; value: number }[];
  holdData: { time: string; value: number }[];
}

const ChartOne: React.FC<ChartOneProps> = ({ portfolioData, holdData }) => {
  const options: ApexOptions = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#3C50E0", "#80CAEE"],
    chart: {
      fontFamily: "Satoshi, sans-serif",
      height: 335,
      type: "line", // Cambio de area a line
      dropShadow: {
        enabled: true,
        color: "#623CEA14",
        top: 10,
        blur: 4,
        left: 0,
        opacity: 0.1,
      },
      toolbar: {
        show: false,
      },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: 300,
          },
        },
      },
      {
        breakpoint: 1366,
        options: {
          chart: {
            height: 350,
          },
        },
      },
    ],
    stroke: {
      width: [2, 2],
      curve: "straight",
    },
    grid: {
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 0, // Tamaño de los puntos en la línea
      hover: {
        size: 6, // Tamaño de los puntos al pasar el mouse
      },
    },
    xaxis: {
      type: "datetime",
      categories: portfolioData.map((d) => d.time),
    },
    yaxis: {
      labels: {
        formatter: function (value) {
          return value.toFixed(4); // Mostrar 4 decimales
        },
      },
      title: {
        style: {
          fontSize: "0px",
        },
      },
      opposite: true, // Mostrar la barra lateral en el lado derecho
    },
  };

  const series = [
    {
      name: "Portfolio Value",
      data: portfolioData.map((d) => d.value),
    },
    {
      name: "Hold Value",
      data: holdData.map((d) => d.value),
    },
  ];

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
        <div className="flex w-full flex-wrap gap-3 sm:gap-5">
          <div className="flex min-w-47.5">
            <span className="mr-2 mt-1 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-primary">
              <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-primary"></span>
            </span>
            <div className="w-full">
              <p className="font-semibold text-primary">Total Revenue</p>
              <p className="text-sm font-medium">
                Fecha: {portfolioData[0]?.time} -{" "}
                {portfolioData[portfolioData.length - 1]?.time}
              </p>
            </div>
          </div>
          <div className="flex min-w-47.5">
            <span className="mr-2 mt-1 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-secondary">
              <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-secondary"></span>
            </span>
            <div className="w-full">
              <p className="font-semibold text-secondary">Total Sales</p>
              <p className="text-sm font-medium">
                Fecha: {portfolioData[0]?.time} -{" "}
                {portfolioData[portfolioData.length - 1]?.time}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div id="chartOne" className="-ml-5">
          <ReactApexChart
            options={options}
            series={series}
            type="line" // Cambio de area a line
            height={350}
            width={"100%"}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartOne;
