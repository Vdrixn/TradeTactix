import React, { useState, useRef, useEffect } from "react";

const ConsultaAI: React.FC = () => {
  const [description, setDescription] = useState<string>("");
  const [algorithm, setAlgorithm] = useState<string>("");
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>("");
  const algorithmRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerateAlgorithm = () => {
    if (!description) {
      setAlertMessage("Escribe una descripción antes de generar el algoritmo.");
      setShowAlert(true);
      return;
    }
    console.log(description);
    setShowAlert(false);
    fetch("http://127.0.0.1:8080/api/generate-algorithm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instructions: description,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setAlertMessage(data.error);
          setShowAlert(true);
        } else {
          setAlgorithm(data.codigo);
          setShowAlert(false);
        }
      })
      .catch((err) => {
        setAlertMessage("Error generando el algoritmo");
        setShowAlert(true);
        console.error(err);
      });
  };

  const handleCopyToClipboard = () => {
    if (algorithmRef.current) {
      algorithmRef.current.select();
      document.execCommand("copy");
      alert("Algoritmo copiado al portapapeles");
    }
  };

  useEffect(() => {
    if (algorithmRef.current) {
      algorithmRef.current.style.height = "auto";
      algorithmRef.current.style.height = `${algorithmRef.current.scrollHeight}px`;
    }
  }, [algorithm]);

  return (
    <div className="flex flex-col p-4">
      {showAlert && (
        <div className="flex w-full border-l-6 border-[#F87171] bg-[#F87171] bg-opacity-[15%] px-7 py-8 shadow-md dark:bg-[#1B1B24] dark:bg-opacity-30 md:p-9">
          <div className="mr-5 flex h-9 w-full max-w-[36px] items-center justify-center rounded-lg bg-[#F87171]">
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.4917 7.65579L11.106 12.2645C11.2545 12.4128 11.4715 12.5 11.6738 12.5C11.8762 12.5 12.0931 12.4128 12.2416 12.2645C12.5621 11.9445 12.5623 11.4317 12.2423 11.1114C12.2422 11.1113 12.2422 11.1113 12.2422 11.1113C12.242 11.1111 12.2418 11.1109 12.2416 11.1107L7.64539 6.50351L12.2589 1.91221L12.2595 1.91158C12.5802 1.59132 12.5802 1.07805 12.2595 0.757793C11.9393 0.437994 11.4268 0.437869 11.1064 0.757418C11.1063 0.757543 11.1062 0.757668 11.106 0.757793L6.49234 5.34931L1.89459 0.740581L1.89396 0.739942C1.57364 0.420019 1.0608 0.420019 0.740487 0.739944C0.42005 1.05999 0.419837 1.57279 0.73985 1.89309L6.4917 7.65579ZM6.4917 7.65579L1.89459 12.2639L1.89395 12.2645C1.74546 12.4128 1.52854 12.5 1.32616 12.5C1.12377 12.5 0.906853 12.4128 0.758361 12.2645L1.1117 11.9108L0.758358 12.2645C0.437984 11.9445 0.437708 11.4319 0.757539 11.1116C0.757812 11.1113 0.758086 11.111 0.75836 11.1107L5.33864 6.50287L0.740487 1.89373L6.4917 7.65579Z"
                fill="#ffffff"
                stroke="#ffffff"
              ></path>
            </svg>
          </div>
          <div className="w-full">
            <h5 className="mb-3 font-semibold text-[#B45454]">
              {alertMessage}
            </h5>
          </div>
        </div>
      )}
      <div>
        <div
          className="mb-4 flex flex-col justify-between rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
          style={{ minHeight: "100%" }}
        >
          <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
            <h3 className="text-gray-200 text-xl font-medium">
              Descripción del Algoritmo
            </h3>
          </div>
          <div className="flex flex-grow flex-col p-6.5">
            <textarea
              rows={6}
              placeholder={
                "Escribe una descripción de lo que quieres que haga tu algoritmo"
              }
              className="w-full flex-grow rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
          <div className="flex justify-center p-6.5">
            <button
              className="dark:bg-primarydark flex h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-white shadow-default transition hover:shadow-md"
              onClick={handleGenerateAlgorithm}
            >
              Generar Algoritmo
            </button>
          </div>
        </div>
        {algorithm && (
          <div
            className="mb-4 flex flex-col justify-between rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
            style={{ minHeight: "100%" }}
          >
            <div className="flex items-center justify-between border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="text-gray-200 text-xl font-medium">
                Algoritmo Generado
              </h3>
              <button
                className="dark:bg-primarydark flex items-center justify-center rounded-lg bg-primary px-4 py-2 font-semibold text-white shadow-default transition hover:shadow-md"
                onClick={handleCopyToClipboard}
              >
                Copiar
              </button>
            </div>
            <div className="flex flex-grow flex-col p-6.5">
              <textarea
                ref={algorithmRef}
                rows={10}
                placeholder={
                  "Aquí se mostrará el código del algoritmo generado"
                }
                className="w-full flex-grow resize-none rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                style={{ overflow: "hidden" }}
              ></textarea>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultaAI;
