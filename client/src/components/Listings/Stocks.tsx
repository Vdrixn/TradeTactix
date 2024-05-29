"use client";
import React from "react";
import StocksTable from "../Tables/StocksTable";
import CardDataStats from "../CardDataStats";
import MapOne from "../Maps/MapOne";

const Stocks: React.FC = () => {
  return (
    <>
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12 xl:col-span-12">
          <StocksTable />
        </div>
      </div>
    </>
  );
};

export default Stocks;
