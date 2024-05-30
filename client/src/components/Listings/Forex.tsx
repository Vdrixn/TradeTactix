"use client";
import React from "react";
import ForexTable from "../Tables/ForexTable";
import CardDataStats from "../CardDataStats";

const Forex: React.FC = () => {
  return (
    <>
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12 xl:col-span-12">
          <ForexTable />
        </div>
      </div>
    </>
  );
};

export default Forex;
