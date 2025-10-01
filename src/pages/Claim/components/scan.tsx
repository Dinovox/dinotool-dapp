// Composant Test
import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';

const Scan = ({ onDataScan }: any) => {
  // Utilisation de la déstructuration pour extraire onDataScan des props
  const [data, setData] = useState('Please scan a QR code');
  const constraints = {
    facingMode: 'environment' // 'user' pour la caméra frontale, 'environment' pour la caméra arrière
  };

  return (
    <>
      <QrReader
        onResult={(result, error) => {
          if (result) {
            const text = result.getText ? result.getText() : undefined;
            if (text) {
              setData(text);
              onDataScan(text); // Appel de la fonction de rappel avec la nouvelle donnée
            }
          }

          if (error) {
            console.info(error);
          }
        }}
        constraints={constraints}
      />
      <p>{data}</p>
    </>
  );
};

export default Scan;
