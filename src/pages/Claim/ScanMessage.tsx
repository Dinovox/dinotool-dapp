import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import {
  faFileSignature,
  faBroom,
  faArrowsRotate,
  faQrcode
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'components/Button';
import { OutputContainer } from 'components/OutputContainer';
import { useNavigate, useParams } from 'react-router-dom';
import Scan from './components/scan';
import { ScanSuccess } from './components/ScanSuccess';
import { useGetIsLoggedIn } from 'lib';
import { dino_claim_url } from 'config';

export const ScanMessage = () => {
  //set url from code and reverse using navigate
  const navigate = useNavigate();
  //read id (code) from url
  let { id } = useParams();
  const [code, setCode] = useState(id ? id : '');

  const isLoggedIn = useGetIsLoggedIn();
  const [isSubmit, setIsSumbit] = useState(false);
  const [scan, setScan] = useState<any>('No result');
  const [showScan, setShowScan] = useState<any>(false);
  const [showSuccess, setShowSuccess] = useState<any>(false);

  const handledRef = useRef(false);
  //enable camera for qrcode scan
  const handleShowScan = (data: any) => {
    // if (!showScan) {
    //   setCode('');
    //   setShowSuccess(false);
    //   setIsSumbit(false);
    // }
    setShowScan(!showScan);
  };

  //read code from qrcode scan url
  // const url = 'https://app.dinovox.com/claim/';
  const url = dino_claim_url + '/';
  const handleDataFromScan = (data: any) => {
    if (handledRef.current) return; // ignore les lectures suivantes
    if (typeof data !== 'string') return;

    setScan(data);
    if (data.startsWith(url)) {
      handledRef.current = true; // lock tout de suite
      const message = data.substring(url.length);
      const remove_style = message.split('?')[0];
      setCode(remove_style);
      setShowScan(false);
      setShowSuccess(true);

      if (isLoggedIn) {
        setIsSumbit(true);
      }

      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    }
  };

  //Navigate to /claim/:code when code state change
  useEffect(() => {
    if (code === 'undefined' || code == '') {
      setCode('');
      navigate(`/claim/`, { replace: true });
    }
    navigate(`/claim/${code}`, { replace: true });
  }, [code, navigate]);

  const handleSubmit = (e: MouseEvent) => {
    setIsSumbit(true);
  };
  const handleReset = (e: MouseEvent) => {
    setCode('');
    setIsSumbit(false);
    setShowSuccess(false);
  };

  return (
    <div className='flex flex-col gap-6 spec-form  '>
      <div className='flex flex items-start spec-2'>
        {!code && (
          <Button
            data-testid='signMsgBtn'
            onClick={handleShowScan}
            className='dinoButton '
          >
            <FontAwesomeIcon icon={faQrcode} className='mr-1' />
            Scan QR
          </Button>
        )}
      </div>{' '}
      {showScan && !isSubmit && (
        <div className=' items-start' style={{ maxWidth: '300px' }}>
          <Scan onDataScan={handleDataFromScan} />
        </div>
      )}{' '}
      {showSuccess && (
        <div className=' items-start' style={{ maxWidth: '300px' }}>
          <img
            src='/SCAN-SUCCESS.png'
            style={{
              width: '300px',
              height: '300px'
            }}
            className='w-full h-20'
          />
        </div>
      )}
      <OutputContainer>
        <input
          className='spec-input-code'
          type='text'
          name='codex'
          placeholder='Scan QRcode or report your code here'
          value={code.trim()}
          onChange={(event) => setCode(event.currentTarget.value)}
          readOnly={isSubmit}
        />{' '}
        {!isSubmit ? (
          <Button
            data-testid='signMsgBtn'
            onClick={handleSubmit}
            disabled={!code || !isLoggedIn}
          >
            <FontAwesomeIcon icon={faFileSignature} className='mr-1' />
            Claim code
          </Button>
        ) : (
          <Button
            data-testid='closeTransactionSuccessBtn'
            id='closeButton'
            onClick={handleReset}
          >
            <FontAwesomeIcon icon={faBroom} className='mr-1' />
            Reset
          </Button>
        )}{' '}
        <div>{isSubmit && <ScanSuccess messageToSign={code} />}</div>
      </OutputContainer>
      {/* {isError && <SignFailure />} */}
    </div>
  );
};
