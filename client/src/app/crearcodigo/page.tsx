"use client";

import React from "react";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import ConsultaAI from "@/components/CrearCodigo/ConsultaAI";

const ForexPage = () => {
  return (
    <DefaultLayout>
      <ConsultaAI />
    </DefaultLayout>
  );
};

export default ForexPage;
