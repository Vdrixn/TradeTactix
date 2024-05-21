// src/app/backtesting/[symbol].tsx
import React from "react";
import { useRouter } from "next/router";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import BacktestingPage from "@/components/Backtesting/BacktestingPage";

const DynamicBacktestingPage: React.FC = () => {
  const router = useRouter();
  const { symbol } = router.query;

  return (
    <DefaultLayout>
      {symbol && <BacktestingPage symbol={symbol as string} />}
    </DefaultLayout>
  );
};

export default DynamicBacktestingPage;
