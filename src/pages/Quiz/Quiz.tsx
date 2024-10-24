import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { useGetMintable } from 'pages/Dashboard/widgets/MintGazAbi/hooks';
import { formatAmount } from 'utils/sdkDappUtils';
import toHex from 'helpers/toHex';
import './MintSFT.css';
import { useGetAccount } from 'hooks';
import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import sold_graout from 'assets/img/sold_graout.jpg';
import { useGetLoginInfo } from '@multiversx/sdk-dapp/hooks/account/useGetLoginInfo';
import axios from 'axios';
import halloween from 'assets/img/halloween.png';
import halloweenCard from 'assets/img/halloween-card.png';
import halloweenBad from 'assets/img/halloween-bad.png';
import lowLife from 'assets/img/low-life.png';

export const Quiz = () => {
  const [project, setProject] = useState('1');
  const { tokenLogin, isLoggedIn } = useGetLoginInfo();
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (tokenLogin && answer) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${tokenLogin.nativeAuthToken}`
          }
        };
        // const { data } = await axios.post(
        //   'http://localhost:3000/code/verify-token',
        //   {},
        //   config
        // );
        const { data } = await axios.post(
          'https://internal.mvx.fr' + '/quiz/halloween',
          {
            answer: answer
          },
          config
        );
        // console.log('data', data);
        setMessage(data?.message);
      } catch (err) {
        console.error('Unable to call getPingAmount - RAW', err);
      }
    }
  };

  return (
    <AuthRedirectWrapper requireAuth={true}>
      <PageWrapper>
        <div className='dinocard-wrapper  rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
          <div className='mintGazTitle dinoTitle' style={{ width: '340px' }}>
            DINOQUIZ
          </div>{' '}
          <div className='dinocard'>
            <div className='hcontainer'>
              <div className='hblock hblock-1'>
                <div className='devine'>Devine et rugis!</div>
              </div>
              <div className='hblock hblock-2'>
                {' '}
                <img src={halloween} className='halloween-image' />
              </div>
              <div className='hblock hblock-3'>
                {' '}
                <form onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor='addresses'>Réponse:</label>
                    <textarea
                      id=''
                      placeholder=''
                      onChange={(e) => {
                        setAnswer(e.target.value);
                        setMessage('');
                      }}
                      required
                      style={{
                        width: '100%',
                        height: '200px',
                        padding: '10px'
                      }}
                    />
                  </div>
                  <button className='dinoButton '>{'Valider'}</button>
                </form>
              </div>
              {message === 'Bonne réponse' && (
                <>
                  <div className='hblock hblock-2'>
                    <span className='greenGraou'>GRAOU !!! </span>Félicitation,
                    tu remportes cette magnifique Dinocard collector Graouween !{' '}
                  </div>
                  <div className='hblock hblock-3'>
                    {' '}
                    <img src={halloweenCard} className='halloween-image' />
                  </div>
                </>
              )}
              {message === 'Mauvaise réponse' && (
                <>
                  <div className='hblock hblock-2'>
                    <span className='greenGraou'>
                      {' '}
                      <img src={lowLife} className='halloween-low' />
                    </span>
                    Mauvaise Réponse. Fais ou ne fais pas. Il n'y a pas d'essai
                  </div>
                  <div className='hblock hblock-3'>
                    {' '}
                    <img src={halloweenBad} className='halloween-image' />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
