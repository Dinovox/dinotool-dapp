import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import './MintSFT.css';
import { useState } from 'react';
import { useGetLoginInfo } from '@multiversx/sdk-dapp/hooks/account/useGetLoginInfo';
import axios from 'axios';
import { internal_api } from 'config';

const halloween = '/assets/img/halloween.png';
const halloweenCard = '/assets/img/halloween-card.png';
const halloweenBad = '/assets/img/halloween-bad.png';
const lowLife = '/assets/img/low-life.png';
const dinovoxLogo = '/dinovox_logo.webp';

export const Quiz = () => {
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
          internal_api + '/quiz/halloween',
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
              {message != 'Bonne réponse' && (
                <>
                  <div className='hblock hblock-1'>
                    <div className='devine'>Devine et rugis!</div>
                  </div>
                  <div className='hblock hblock-2'>
                    {' '}
                    <img
                      src={halloween}
                      className='halloween-image'
                      style={{ marginTop: '30px' }}
                    />
                  </div>
                  <div className='hblock hblock-2'>
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
                </>
              )}

              {message === 'Bonne réponse' && (
                <>
                  <div className='hblock hblock-2'>
                    <p style={{ fontSize: 'x-large', fontWeight: 'bolder' }}>
                      Bienvenue à la super fête
                    </p>
                    <span className='greenGraou'>GRAOUWEEN</span>
                    <br />
                    <p style={{ color: '#6b3f0b' }}>
                      Félicitations, vous avez trouvé le *Dinopass pour rentrer
                      dans la grande fête
                    </p>
                  </div>
                  <div className='hblock hblock-2'>
                    {' '}
                    <img src={halloweenCard} className='halloween-image' />
                  </div>
                  <div className='hblock hblock-1'>
                    <img
                      src={dinovoxLogo}
                      alt='Dinovox Logo'
                      className='w-64 h-auto'
                      style={{ margin: 'auto' }}
                    />
                  </div>
                  <div
                    className='hblock hblock-1'
                    style={{ fontSize: 'smaller' }}
                  >
                    *Le SFT DinoCard collector #11 sera airdrop(distribué
                    gratuitement) dans votre portefeuille une fois l'évènement
                    d'Halloween cloturé
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
