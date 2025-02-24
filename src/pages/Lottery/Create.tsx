import React, { useEffect, useRef, useState } from 'react';
import { Checkbox } from 'antd';
import dayjs from 'dayjs';
import { Modal, Form, Input, Radio, Select, Divider, DatePicker } from 'antd';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import { useGetUserNFT } from 'helpers/useGetUserNft';
import { useGetAccountInfo } from 'hooks';
import { ActionCreate } from './Transaction/ActionCreate';
import BigNumber from 'bignumber.js';
import { graou_identifier, xgraou_identifier } from 'config';
import NftDisplay from './NftDisplay';
import { useGetNftInformations } from './Transaction/helpers/useGetNftInformation';
import { max } from 'moment';
// import { DatePicker } from 'antd-mobile';

const CreateLotteryModal: React.FC<{ count: string; cost: boolean }> = ({
  count,
  cost
}: any) => {
  const [visible, setVisible] = useState(false);
  const [priceType, setPriceType] = useState('');
  const [priceIdentifier, setPriceIdentifier] = useState('');
  const [priceNonce, setPriceNonce] = useState<number>(0);
  const [priceDecimals, setPriceDecimals] = useState<number>(0);
  const [maxTickets, setMaxTickets] = useState<number>(20);
  const [maxPerWallet, setMaxPerWallet] = useState<number | undefined>(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [feePercentage, setFeePercentage] = useState<number>(0.5);
  const [prizeType, setPrizeType] = useState<string>('');
  const [prizeIdentifier, setPrizeIdentifier] = useState('');

  const [prizeDisplay, setPrizeDisplay] = useState(''); // Valeur affichée à l'utilisateur
  const [prizeAmount, setPrizeAmount] = useState(new BigNumber(0)); // Valeur en traitement
  const [priceDisplay, setPriceDisplay] = useState(''); // Valeur affichée à l'utilisateur
  const [priceAmount, setPriceAmount] = useState(new BigNumber(0));

  const [prizeNonce, setPrizeNonce] = useState<number>(0);
  const [prizeDecimals, setPrizeDecimals] = useState<number>(0);
  const [acceptConditions, setAcceptConditions] = useState(false);
  const [prizeTicker, setPrizeTicker] = useState<string>('');
  const [priceTicker, setPriceTicker] = useState<string>('');
  const [prizeBalance, setPrizeBalance] = useState<BigNumber>(new BigNumber(0));

  const { address, account } = useGetAccountInfo();
  const test = new BigNumber(account?.balance).dividedBy(10 ** 18);

  const user_esdt = useGetUserESDT();
  const user_sft = useGetUserNFT(address);

  const showModal = () => {
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleCreate = (values: any) => {
    setVisible(false);
  };

  const handlePrizeType = (e: any) => {
    if (e.target.value === 'NFT') {
      setPrizeType(e.target.value);
      setPrizeIdentifier('');
      setPrizeTicker('');
      setPrizeNonce(0);
      setPrizeAmount(new BigNumber(1));
      setPrizeDisplay('1');
      setPrizeBalance(new BigNumber(1));
    } else if (e.target.value === 'EGLD') {
      setPrizeType('EGLD');
      setPrizeIdentifier('EGLD-000000');
      setPrizeTicker('EGLD-000000');
      setPrizeNonce(0);
      setPrizeDecimals(18);
      setPrizeAmount(new BigNumber(0));
      setPrizeDisplay('');
      setPrizeBalance(new BigNumber(account?.balance));
    } else {
      setPrizeType(e.target.value);
      setPrizeIdentifier('');
      setPrizeTicker('');
      setPrizeNonce(0);
      setPrizeAmount(new BigNumber(0));
      setPrizeDisplay('');
      setPrizeBalance(new BigNumber(0));
    }
  };

  const handlePriceType = (e: any) => {
    if (e.target.value === 'EGLD') {
      setPriceType('EGLD');
      setPriceIdentifier('EGLD-000000');
      setPriceTicker('EGLD-000000');
      setPriceDecimals(18);
    } else if (e.target.value === 'FREE') {
      setPriceType('FREE');
      setMaxPerWallet(maxPerWallet == 0 ? 1 : maxPerWallet);
      setPriceIdentifier('FREE-000000');
      setPriceTicker('FREE-000000');
    } else {
      setPriceType(e.target.value);
      setPriceTicker('');
      setPriceIdentifier('');
    }
    setPriceNonce(0);
    setPriceAmount(new BigNumber(0));
    setPriceDisplay('');
  };

  const price_options =
    priceType === 'ESDT'
      ? user_esdt
      : priceType === 'SFT'
      ? user_sft.filter((token: any) => token.type === 'SemiFungibleESDT')
      : [];

  const prize_options_sft =
    prizeType === 'ESDT'
      ? user_esdt
      : prizeType === 'SFT'
      ? user_sft.filter((token: any) => token.type === 'SemiFungibleESDT')
      : [];
  const prize_options_nft =
    prizeType === 'ESDT'
      ? user_esdt
      : prizeType === 'NFT'
      ? user_sft.filter((token: any) => token.type === 'NonFungibleESDT')
      : [];

  const prize_nft_information = useGetNftInformations(
    prizeTicker,
    prizeNonce.toString(),
    prizeType
  );

  const price_nft_information = useGetNftInformations(
    priceTicker,
    priceNonce.toString(),
    priceType
  );

  const handleStart = (date: dayjs.Dayjs | null) => {
    setStartTime(date ? date.unix() : 0); // Convertit en timestamp Unix (secondes)
  };

  const handleEnd = (date: dayjs.Dayjs | null) => {
    setEndTime(date ? date.unix() : 0); // Convertit en timestamp Unix (secondes)
  };

  const handlePrizeAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    // Permet la saisie vide sans réinitialisation
    if (rawValue === '') {
      setPrizeDisplay('');
      setPrizeAmount(new BigNumber(0));
      return;
    }

    // Vérifie que la valeur est un nombre valide (permet un point unique pour les décimales)
    if (!/^\d*\.?\d*$/.test(rawValue)) {
      return; // Ignore les caractères invalides
    }

    // Vérifie le nombre de décimales autorisées
    const parts = rawValue.split('.');
    if (parts.length === 2 && parts[1].length > prizeDecimals) {
      return; // Bloque si trop de décimales
    }

    setPrizeDisplay(rawValue); // Affichage naturel à l'utilisateur
    // Conversion en BigNumber avec les décimales
    let convertedValue = new BigNumber(rawValue).multipliedBy(
      10 ** prizeDecimals
    );

    // Vérification des limites
    if (convertedValue.isLessThan(0)) {
      return;
    }

    if (
      convertedValue.isGreaterThan(prizeBalance) &&
      ['SFT', 'ESDT', 'EGLD'].includes(prizeType)
    ) {
      convertedValue = new BigNumber(prizeBalance);
      setPrizeDisplay(
        prizeBalance.dividedBy(10 ** prizeDecimals).toFixed(prizeDecimals)
      );
    }

    setPrizeAmount(convertedValue); // Stocke la valeur en BigNumber
  };

  const handlePriceAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;

    // Permet la saisie vide sans réinitialisation
    if (rawValue === '') {
      setPriceDisplay('');
      setPriceAmount(new BigNumber(0));
      return;
    }

    // Vérifie que la valeur est un nombre valide (permet un point unique pour les décimales)
    if (!/^\d*\.?\d*$/.test(rawValue)) {
      return; // Ignore les caractères invalides
    }

    // Vérifie le nombre de décimales autorisées
    const parts = rawValue.split('.');
    if (parts.length === 2 && parts[1].length > priceDecimals) {
      return; // Bloque si trop de décimales
    }

    setPriceDisplay(rawValue); // Affichage naturel à l'utilisateur

    // Conversion en BigNumber avec les décimales
    let convertedValue = new BigNumber(rawValue).multipliedBy(
      10 ** priceDecimals
    );

    // Vérification des limites
    if (convertedValue.isLessThan(0)) {
      return;
    }

    setPriceAmount(convertedValue); // Stocke la valeur en BigNumber
  };

  //hack antd to disable keyboard on mobile
  const [keyboardEnabled, setKeyboardEnabled] = useState(false);
  const handleDropdownChange = () => {
    setTimeout(() => {
      const inputs = document.querySelectorAll(
        '.select-token .ant-select-selection-search-input'
      ) as NodeListOf<HTMLInputElement>;

      inputs.forEach((input) => {
        input.setAttribute('inputmode', keyboardEnabled ? 'text' : 'none');
      });
    }, 500);
  };
  const enableKeyboard = () => {
    setKeyboardEnabled(true);
    setTimeout(() => {
      const input = document.querySelector(
        '.ant-select-selection-search-input'
      ) as HTMLInputElement | null;
      if (input) {
        input.setAttribute('inputmode', 'text'); // ✅ Active le clavier
        input.focus(); // ✅ Forcer le focus (plus d'erreur)
      }
    }, 300);
  };
  const disableKeyboard = () => {
    setKeyboardEnabled(false);
    setTimeout(() => {
      const input = document.querySelector(
        '.ant-select-selection-search-input'
      ) as HTMLInputElement | null;
      if (input) {
        input.setAttribute('inputmode', 'none'); // ✅ Active le clavier
        input.blur(); // ✅ Forcer le focus (plus d'erreur)
      }
    }, 300);
  };

  if (!address) {
    return null;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <button
        onClick={showModal}
        disabled={!address || count >= 4}
        className='dinoButton'
      >
        Create Lottery {count}/4
      </button>

      <Modal
        title='Create Lottery'
        open={visible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form layout='vertical' onFinish={handleCreate}>
          Winning prize
          <div
            style={{
              border: '1px solid rgb(92 129 128)',
              padding: '10px'
            }}
          >
            <Form.Item
              name={'tokenPrizeType'}
              label='Token Type'
              tooltip='What type of token will be rewarded to the winner?'
              rules={[
                {
                  required: false,
                  message: 'Please select the token type!'
                }
              ]}
            >
              <Radio.Group
                onChange={handlePrizeType}
                disabled={acceptConditions}
              >
                <Radio value='ESDT'>ESDT</Radio>
                <Radio value='EGLD'>EGLD</Radio>
                <Radio value='SFT'>SFT</Radio>
                <Radio value='NFT'>NFT</Radio>
              </Radio.Group>
            </Form.Item>{' '}
            {/* Selection du PRIZE */}
            {['ESDT', 'SFT', 'NFT'].includes(prizeType) && (
              <Form.Item
                name={'prizeIdentifier' + prizeType}
                label='Identifier'
                rules={[
                  {
                    required: false,
                    message: 'Please input the price identifier!'
                  }
                ]}
              >
                {' '}
                <Select
                  className='select-token'
                  disabled={acceptConditions}
                  onDropdownVisibleChange={handleDropdownChange}
                  onChange={(value, datas: any) => {
                    disableKeyboard();
                    setPrizeIdentifier(value);
                    setPrizeTicker(
                      datas?.datas?.ticker ? datas?.datas?.ticker : ''
                    );
                    setPrizeNonce(
                      datas?.datas?.nonce ? datas?.datas?.nonce : 0
                    );
                    setPrizeDecimals(
                      datas?.datas?.decimals ? datas?.datas?.decimals : 0
                    );
                    setPrizeBalance(new BigNumber(datas?.datas?.balance));
                    setPrizeAmount(new BigNumber(prizeType === 'NFT' ? 1 : 0));
                    setPrizeDisplay(prizeType === 'NFT' ? '1' : '');
                  }}
                  showSearch={true}
                  placeholder='Select a token or enter manually'
                  optionFilterProp='children'
                  filterOption={(input, option) =>
                    String(option?.children ?? '')
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                  dropdownRender={(menu) => (
                    <>
                      {' '}
                      {keyboardEnabled ? (
                        <button onClick={disableKeyboard}>
                          Disable keyboard
                        </button>
                      ) : (
                        <button onClick={enableKeyboard}>
                          Enable keyboard
                        </button>
                      )}
                      {menu}
                      <Divider style={{ margin: '8px 0' }} />
                      <Input
                        disabled={acceptConditions}
                        value={prizeIdentifier}
                        style={{ padding: '8px' }}
                        onChange={(e) => {
                          const value = (e.target as HTMLInputElement).value;
                          setPrizeIdentifier(value);
                          setPrizeNonce(0);
                          setPrizeDecimals(0);
                        }}
                      />
                    </>
                  )}
                >
                  {' '}
                  {prizeType === 'ESDT' &&
                    user_esdt.map((token: any) => (
                      <Select.Option
                        onFocus={(e: any) => e.target.blur()}
                        inputMode='none'
                        readOnly={true}
                        key={token.identifier}
                        value={token.identifier}
                        datas={token}
                        disabled={[
                          xgraou_identifier,
                          graou_identifier
                        ].includes(token.identifier)}
                      >
                        {token.identifier}
                      </Select.Option>
                    ))}{' '}
                  {prizeType === 'SFT' &&
                    prize_options_sft.map((token: any) => (
                      <Select.Option
                        onFocus={(e: any) => e.target.blur()}
                        inputMode='none'
                        readOnly={true}
                        key={token.identifier}
                        value={token.identifier}
                        datas={token}
                      >
                        {token.identifier}
                      </Select.Option>
                    ))}{' '}
                  {prizeType === 'NFT' &&
                    prize_options_nft.map((token: any) => (
                      <Select.Option
                        onFocus={(e: any) => e.target.blur()}
                        inputMode='none'
                        readOnly={true}
                        key={token.identifier}
                        value={token.identifier}
                        datas={token}
                      >
                        {token.identifier}
                      </Select.Option>
                    ))}{' '}
                </Select>
              </Form.Item>
            )}
            {/* Photo du PRIZE */}
            {prizeIdentifier && ['NFT', 'SFT'].includes(prizeType) && (
              <NftDisplay nftInfo={prize_nft_information} amount={0} />
            )}{' '}
            {/* Montant du PRIZE */}{' '}
            {['ESDT', 'SFT', 'EGLD'].includes(prizeType) && (
              <Form.Item
                name='prizeAmount'
                label='Amount'
                rules={[
                  {
                    required: false,
                    message: 'Please input the price amount!'
                  }
                ]}
              >
                {' '}
                <Input
                  type='number' // Utilisation de `text` pour éviter les restrictions des `number`
                  inputMode='decimal' // Active le clavier numérique sur mobile
                  onWheel={(e) => (e.target as HTMLInputElement).blur()} // Désactive le scroll
                  value={prizeDisplay} // Valeur affichée
                  onChange={handlePrizeAmountChange} // Gestion de la saisie
                  disabled={prizeType === 'NFT' || acceptConditions}
                />
              </Form.Item>
            )}
          </div>
          Entry cost
          <div
            style={{
              border: '1px solid rgb(92 129 128)',
              padding: '10px'
            }}
          >
            {prizeIdentifier && prizeAmount.isGreaterThan(0) && (
              <>
                {/* Selection type de PRICE */}
                <Form.Item
                  name='tokenPriceType'
                  label='Token Type'
                  tooltip='What type of token will be used to enter the lottery?'
                  rules={[
                    {
                      required: false,
                      message: 'Please select the token type!'
                    }
                  ]}
                >
                  <Radio.Group
                    onChange={handlePriceType}
                    disabled={acceptConditions}
                    defaultValue={priceType}
                  >
                    <Radio value='ESDT'>ESDT</Radio>
                    <Radio value='EGLD'>EGLD</Radio>
                    <Radio value='SFT'>SFT</Radio>
                    <Radio value='FREE'>FREE</Radio>
                  </Radio.Group>{' '}
                  {priceType == 'FREE' && (
                    <div style={{ color: 'red', marginTop: '10px' }}>
                      Warning: We cannot prevent bots from participating in free
                      lotteries. To ensure fairness, we recommend using paid
                      lotteries, even if it involves distributing an SFT in
                      advance.
                    </div>
                  )}
                </Form.Item>

                {/* Selection du PRICE */}
                {['ESDT', 'SFT'].includes(priceType) && (
                  <Form.Item
                    name={'priceIdentifier' + priceType}
                    label='Identifier'
                    rules={[
                      {
                        required: false,
                        message: 'Please input the price identifier!'
                      }
                    ]}
                  >
                    {' '}
                    <Select
                      defaultValue={priceIdentifier}
                      className='select-token'
                      disabled={acceptConditions}
                      onDropdownVisibleChange={handleDropdownChange}
                      onChange={(value, datas: any) => {
                        disableKeyboard();
                        setPriceIdentifier(value);
                        setPriceTicker(
                          datas?.datas?.ticker ? datas?.datas?.ticker : ''
                        );
                        setPriceNonce(
                          datas?.datas?.nonce > 0 ? datas?.datas?.nonce : 0
                        );
                        setPriceDecimals(
                          datas?.datas?.decimals ? datas?.datas?.decimals : 0
                        );
                        setPriceAmount(new BigNumber(0));
                        setPriceDisplay('');
                      }}
                      showSearch={true}
                      placeholder='Select a token or enter manually'
                      optionFilterProp='children'
                      filterOption={(input, option) =>
                        String(option?.children ?? '')
                          .toLowerCase()
                          .indexOf(input.toLowerCase()) >= 0
                      }
                      dropdownRender={(menu) => (
                        <>
                          {keyboardEnabled ? (
                            <button onClick={disableKeyboard}>
                              Disable keyboard
                            </button>
                          ) : (
                            <button onClick={enableKeyboard}>
                              Enable keyboard
                            </button>
                          )}
                          {menu}
                          <Divider style={{ margin: '8px 0' }} />
                          <Input
                            disabled={acceptConditions}
                            value={priceIdentifier}
                            style={{ padding: '8px' }}
                            onChange={(e) => {
                              const value = (e.target as HTMLInputElement)
                                .value;
                              setPriceIdentifier(value);
                              setPriceNonce(0);
                              setPriceDecimals(0);
                            }}
                          />
                        </>
                      )}
                    >
                      {''}
                      {price_options.map((token: any) => (
                        <Select.Option
                          onFocus={(e: any) => e.target.blur()}
                          inputMode='none'
                          readOnly={true}
                          key={token.identifier}
                          value={token.identifier}
                          datas={token}
                          disabled={[
                            xgraou_identifier,
                            graou_identifier
                          ].includes(token.identifier)}
                        >
                          {token.identifier}
                        </Select.Option>
                      ))}{' '}
                    </Select>
                  </Form.Item>
                )}
                {/* Tout condensé dans price option */}
                {/* {priceType == 'SFT' && (
                  <Form.Item name='priceNonce' label='Nonce'>
                    {' '}
                    <Input type='text' value={priceNonce} disabled />
                  </Form.Item>
                )} */}
                {/* debug */}
                {/* {(priceType == 'ESDT' || priceType == 'EGLD') && (
                  <Form.Item name='priceDecimals' label='Decimals'>
                    {' '}
                    <Input type='text' value={priceDecimals} disabled />
                  </Form.Item>
                )} */}
                {priceIdentifier && ['SFT'].includes(priceType) && (
                  <NftDisplay nftInfo={price_nft_information} amount={0} />
                )}
                {/* Montant du PRICE */}
                {['ESDT', 'SFT', 'EGLD'].includes(priceType) && (
                  <Form.Item
                    name='priceAmount'
                    label='Amount'
                    rules={[
                      {
                        required: false,
                        message: 'Please input the price amount!'
                      }
                    ]}
                  >
                    {' '}
                    <Input
                      type='number' // Utilisation de `text` pour éviter les restrictions des `number`
                      inputMode='decimal' // Active le clavier numérique sur mobile
                      onWheel={(e) => (e.target as HTMLInputElement).blur()} // Désactive le scroll
                      value={priceDisplay} // Valeur affichée
                      onChange={handlePriceAmountChange} // Gestion de la saisie
                      disabled={acceptConditions}
                    />
                    {/* <Input
                      type='number'
                      disabled={acceptConditions}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      value={priceAmount}
                      onChange={(e) => {
                        const value: any = (e.target as HTMLInputElement).value;
                        if (value.split('.')[1]?.length > 18) {
                          setPriceAmount(0);
                        } else {
                          setPriceAmount(value);
                        }
                      }}
                    /> */}
                  </Form.Item>
                )}
              </>
            )}
          </div>
          Configuration
          <div
            style={{
              border: '1px solid rgb(92 129 128)',
              padding: '10px'
            }}
          >
            {prizeIdentifier &&
              prizeAmount.isGreaterThan(0) &&
              ((priceIdentifier && priceAmount.isGreaterThan(0)) ||
                priceType == 'FREE') && (
                <>
                  <Form.Item
                    name='maxTickets'
                    label='Total Tickets'
                    help='Minimum 4 and maximum 100'
                    tooltip='The maximum number of tickets that can be sold.'
                    rules={[
                      {
                        required: false,
                        message: 'Please input the maximum number of tickets!'
                      }
                    ]}
                    initialValue={20}
                  >
                    {' '}
                    <Input
                      type='number'
                      disabled={true}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      value={maxTickets}
                      onChange={(e) => {
                        const value: any = (e.target as HTMLInputElement).value;
                        if (!/^\d*\.?\d*$/.test(value)) {
                          return; // Ignore les caractères invalides
                        } else if (value > 100) {
                          setMaxTickets(100);
                        } else if (value < 4) {
                          setMaxTickets(4);
                        } else {
                          setMaxTickets(value);
                        }

                        setMaxPerWallet((prevMaxPerWallet = 0) => {
                          return prevMaxPerWallet > maxTickets / 4
                            ? Math.floor(maxTickets / 4)
                            : prevMaxPerWallet;
                        });
                      }}
                    />
                    <Input
                      type='range'
                      min={4}
                      max={100}
                      value={maxTickets}
                      defaultValue={maxTickets}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        setMaxTickets(value);

                        setMaxPerWallet((prevMaxPerWallet = 0) => {
                          return prevMaxPerWallet > maxTickets / 4
                            ? Math.floor(maxTickets / 4)
                            : prevMaxPerWallet;
                        });
                      }}
                      disabled={acceptConditions}
                    />
                  </Form.Item>

                  <Form.Item
                    name='maxPerWallet'
                    label='Max Per Wallet'
                    tooltip='Leave 0 for unlimited'
                    help='Minimum 0 and maximum 25% of total tickets'
                    rules={[
                      {
                        required: false,
                        message:
                          'Please input the maximum number of tickets per wallet!'
                      }
                    ]}
                    initialValue={0}
                  >
                    {' '}
                    <Input
                      type='number'
                      disabled={true}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      value={maxPerWallet}
                      onChange={(e) => {
                        const value: any = (e.target as HTMLInputElement).value;
                        if (!/^\d*\.?\d*$/.test(value)) {
                          return; // Ignore les caractères invalides
                        } else if (value > maxTickets / 4) {
                          setMaxPerWallet(Math.floor(maxTickets / 4));
                        } else if (value < 0) {
                          setMaxPerWallet(0);
                        } else {
                          setMaxPerWallet(value);
                        }
                      }}
                    />
                    <Input
                      type='range'
                      min={0}
                      max={Math.floor(maxTickets / 4)}
                      value={maxPerWallet}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        setMaxPerWallet(value);
                      }}
                      disabled={acceptConditions}
                    />
                  </Form.Item>
                  <Form.Item
                    name='startTime'
                    label='Start'
                    tooltip='Leave empty for immediate start'
                    rules={[
                      {
                        required: false,
                        message: 'Please select the start time!'
                      }
                    ]}
                  >
                    <DatePicker
                      showTime
                      onChange={handleStart}
                      popupClassName='custom-datepicker'
                      onFocus={(e) => e.target.blur()}
                      inputMode='none'
                      readOnly={true}
                    />
                  </Form.Item>
                  <Form.Item
                    name='endTime'
                    label='End'
                    tooltip='Leave empty for no end'
                    rules={[
                      {
                        required: false,
                        message: 'Please select the end time!'
                      }
                    ]}
                  >
                    <DatePicker
                      showTime
                      onChange={handleEnd}
                      popupClassName='custom-datepicker'
                      onFocus={(e) => e.target.blur()}
                      inputMode='none'
                      readOnly={true}
                    />
                  </Form.Item>
                  <Form.Item
                    name='feePercentage'
                    label='Fee Percentage'
                    tooltip='Fees will be deducted from the creator’s pool to support the development of the platform.'
                    help='Minimum 0.5% and maximum 10%'
                    rules={[
                      {
                        required: false,
                        message: 'Please input the fee percentage!'
                      }
                    ]}
                  >
                    {' '}
                    <Input
                      type='number'
                      value={feePercentage}
                      disabled
                      onChange={(e) => {
                        const value: any = (e.target as HTMLInputElement).value;
                        if (value > 10) {
                          setFeePercentage(10);
                        } else if (value < 0.5) {
                          setFeePercentage(0.5);
                        } else {
                          setFeePercentage(value);
                        }
                      }}
                    />
                    <Input
                      type='range'
                      step={0.5}
                      min={0.5}
                      max={10}
                      value={feePercentage}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setFeePercentage(value);
                      }}
                      disabled={acceptConditions}
                    />
                  </Form.Item>
                </>
              )}
          </div>
          {prizeIdentifier &&
            prizeAmount.isGreaterThan(0) &&
            ((priceIdentifier && priceAmount.isGreaterThan(0)) ||
              priceType == 'FREE') && (
              <>
                <Form.Item
                  name='acceptConditions'
                  valuePropName='checked'
                  rules={[
                    {
                      validator: (_, value) =>
                        value
                          ? Promise.resolve()
                          : Promise.reject(new Error('Check before submit!'))
                    }
                  ]}
                >
                  <Checkbox
                    disabled={!cost}
                    onChange={() => setAcceptConditions(!acceptConditions)}
                  >
                    {' '}
                    {!cost ? (
                      <span>
                        You need 10 XGRAOU to start the lottery. Get some by
                        staking a{' '}
                        <a
                          style={{ color: 'blue' }}
                          href='https://xoxno.com/collection/DINOVOX-cb2297'
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          DINOVOX
                        </a>{' '}
                        at{' '}
                        <a
                          style={{ color: 'blue' }}
                          href='https://www.dinovox.com/fr/staking'
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          dinovox.com
                        </a>
                      </span>
                    ) : (
                      'Pay 10 XGRAOU to start the lottery'
                    )}
                  </Checkbox>
                </Form.Item>
                <Form.Item>
                  <ActionCreate
                    prize_identifier={prizeTicker}
                    prize_nonce={prizeNonce}
                    prize_decimals={prizeDecimals}
                    prize_amount={prizeAmount}
                    //
                    price_identifier={priceTicker}
                    price_nonce={priceNonce}
                    price_decimals={priceDecimals}
                    price_amount={priceAmount}
                    //
                    max_tickets={maxTickets}
                    max_per_wallet={maxPerWallet}
                    start_time={startTime}
                    end_time={endTime}
                    fee_percentage={Math.ceil(feePercentage * 100)}
                    acceptConditions={acceptConditions}
                    setAcceptConditions={setAcceptConditions}
                    disabled={!acceptConditions || !cost}
                  />{' '}
                </Form.Item>
              </>
            )}
        </Form>
      </Modal>
    </div>
  );
};

export default CreateLotteryModal;
