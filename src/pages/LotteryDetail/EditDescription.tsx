import { useEffect, useState } from 'react';
import { useGetLoginInfo } from 'lib';
import axios from 'axios';
import { internal_api } from 'config';
import { useNavigate } from 'react-router-dom';

export const EditDescription = ({ lottery_id, lottery_description }: any) => {
  const [message, setMessage] = useState('');
  const { tokenLogin, isLoggedIn } = useGetLoginInfo();
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setDescription(lottery_description);
  }, [lottery_description]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (tokenLogin) {
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
        const { data } = await axios.put(
          internal_api + '/dinovox/lotteries/' + lottery_id,
          {
            description: description
          },
          config
        );
        setMessage(data?.message);
        //todo : refonte de la fonction à prévoir pour eviter le reload de la page
        if (data?.message === 'Updated') {
          window.location.href = `/lotteries/${lottery_id}`;
        }
      } catch (err) {
        console.error('Unable to call updateDescription', err);
        console.log(err);
      }
    }
  };

  return (
    <>
      <div className='textarea-wrapper align-center'>
        <div className='text-label'>Edit description</div>
        <textarea
          id='description'
          placeholder='Décris ta loterie avec style... 🎁'
          onChange={(e) => {
            setDescription(e.target.value);
            setMessage('');
          }}
          value={description}
          className='textarea-enhanced'
        />{' '}
        <button onClick={handleSubmit} className='dinoButton'>
          {'Update'}
        </button>{' '}
        <p>{message}</p>
      </div>
    </>
  );
};
