import React, { useState } from "react";
import CheckboxTwo from "./CheckboxTwo"; // Asegúrate de ajustar la ruta según sea necesario

const CheckboxGroup: React.FC = () => {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const handleCheckboxChange = (value: string, isChecked: boolean) => {
    setSelectedValues((prevValues) => {
      if (isChecked) {
        return [...prevValues, value];
      } else {
        return prevValues.filter((item) => item !== value);
      }
    });
  };

  return (
    <div className="text-gray-400 mb-2 block">
      <div className="flex flex-col gap-2 px-4 py-1">
        <CheckboxTwo
          value="15m"
          label="15 Minutos"
          onChange={handleCheckboxChange}
        />
        <CheckboxTwo
          value="30m"
          label="30 Minutos"
          onChange={handleCheckboxChange}
        />
        <CheckboxTwo value="1h" label="1 Hora" onChange={handleCheckboxChange} />
        <CheckboxTwo
          value="1D"
          label="1 Día"
          onChange={handleCheckboxChange}
        />
        <div className="mt-4">
          <h4>Selected Values:</h4>
          <ul>
            {selectedValues.map((value) => (
              <li key={value}>{value}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CheckboxGroup;
