import React from "react";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Forex from "@/components/Listings/Forex";

export const metadata: Metadata = {
  title: "Next.js Form Elements | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Form Elements page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const ForexPage = () => {
  return (
    <DefaultLayout>
      <Forex />
    </DefaultLayout>
  );
};

export default ForexPage;
