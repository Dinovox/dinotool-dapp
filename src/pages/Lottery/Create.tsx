import React, { useEffect, useRef, useState } from 'react';
import { Checkbox } from 'antd';
import dayjs from 'dayjs';
import {
  Modal,
  Form,
  Input,
  Radio,
  Select,
  Divider,
  DatePicker,
  CheckboxChangeEvent
} from 'antd';

import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import { useGetUserNFT } from 'helpers/useGetUserNft';
import { useGetAccountInfo } from 'hooks';
import { ActionCreate } from './Transaction/ActionCreate';
import BigNumber from 'bignumber.js';
import { graou_identifier, xgraou_identifier } from 'config';
import NftDisplay from './NftDisplay';
import { useGetNftInformations } from './Transaction/helpers/useGetNftInformation';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { Trans, useTranslation } from 'react-i18next';
import { formatAmount } from 'utils';
import { J } from 'framer-motion/dist/types.d-B50aGbjN';

const CreateLotteryModal: React.FC<{
  count: string;
  cost_graou: boolean;
  cost_egld: boolean;
}> = ({ count, cost_graou, cost_egld }: any) => {
  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();

  const [visible, setVisible] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [autoDraw, setAutoDraw] = useState(false);
  const [priceType, setPriceType] = useState('');
  const [priceIdentifier, setPriceIdentifier] = useState('');
  const [priceNonce, setPriceNonce] = useState<number>(0);
  const [priceDecimals, setPriceDecimals] = useState<number>(0);
  const [maxTickets, setMaxTickets] = useState<number>(20);
  const [maxPerWallet, setMaxPerWallet] = useState<number | undefined>(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [feePercentage, setFeePercentage] = useState<number>(10);
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
  const [payWith, setPayWith] = useState('');

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
    if (e.target.value === 'Nft') {
      setPrizeType(e.target.value);
      setPrizeIdentifier('');
      setPrizeTicker('');
      setPrizeNonce(0);
      setPrizeAmount(new BigNumber(1));
      setPrizeDisplay('1');
      setPrizeBalance(new BigNumber(1));
    } else if (e.target.value === 'Egld') {
      setPrizeType('Egld');
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
    if (e.target.value === 'Egld') {
      setPriceType('Egld');
      setPriceIdentifier('EGLD-000000');
      setPriceTicker('EGLD-000000');
      setPriceDecimals(18);
      setPriceAmount(new BigNumber(0));
      setPriceDisplay('');
    } else {
      setPriceType(e.target.value);
      setPriceTicker('');
      setPriceIdentifier('');
      setPriceAmount(new BigNumber(0));
      setPriceDisplay('');
    }
    setPriceNonce(0);
  };

  const price_options =
    priceType === 'Esdt'
      ? user_esdt
      : priceType === 'Sft'
      ? user_sft.filter((token: any) => token.type === 'SemiFungibleESDT')
      : [];

  const prize_options_sft =
    prizeType === 'Esdt'
      ? user_esdt
      : prizeType === 'Sft'
      ? user_sft.filter((token: any) => token.type === 'SemiFungibleESDT')
      : [];
  const prize_options_nft =
    prizeType === 'Esdt'
      ? user_esdt
      : prizeType === 'Nft'
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
      ['Sft', 'Esdt', 'Egld'].includes(prizeType)
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

  function handleIsFree(e: CheckboxChangeEvent): void {
    const checked = e.target.checked;
    setIsFree(checked);
    setIsLocked(false);
    setMaxTickets(50);
    setPriceType(checked ? 'Esdt' : '');
    setPriceIdentifier(checked ? graou_identifier : '');
    setPriceTicker(checked ? graou_identifier : '');
    setPriceDecimals(checked ? 18 : 0);
    setPriceAmount(new BigNumber(checked ? 100 * 10 ** 18 : 0));
    setPriceDisplay(checked ? '100' : '');
    setMaxPerWallet(checked ? 1 : 0);
    setPriceNonce(0);
    setMaxTickets(50);
  }

  function handleIsLocked(e: CheckboxChangeEvent): void {
    const checked = e.target.checked;
    setAutoDraw(checked);
    setIsFree(false);
    setIsLocked(checked);
    setPriceType(checked ? 'Esdt' : '');
    setPriceIdentifier(checked ? graou_identifier : '');
    setPriceTicker(checked ? graou_identifier : '');
    setPriceDecimals(checked ? 18 : 0);
    setPriceAmount(new BigNumber(checked ? 100 * 10 ** 18 : 0));
    setPriceDisplay(checked ? '100' : '');
    setMaxPerWallet(checked ? 1 : 0);
    setPriceNonce(0);
    setMaxTickets(maxTickets > 50 ? 50 : maxTickets);
  }

  const isValidNumber = (value: any) =>
    BigNumber.isBigNumber(value) && value.isFinite();

  const totalPrice = new BigNumber(priceAmount.multipliedBy(maxTickets) || 0);

  const platformFee =
    priceType === 'Nft' || priceType === 'Sft'
      ? new BigNumber(0)
      : totalPrice
          .multipliedBy(new BigNumber(feePercentage || 0))
          .dividedBy(100)
          .decimalPlaces(0, BigNumber.ROUND_FLOOR);

  // const platformFee =
  //   priceType === 'Nft' || priceType === 'Sft'
  //     ? new BigNumber(0)
  //     : totalPrice.multipliedBy(feePercentage).dividedBy(100).decimalPlaces(0);

  const royalties =
    priceType === 'Nft' || priceType === 'Sft'
      ? new BigNumber(0)
      : totalPrice
          .minus(platformFee)
          .multipliedBy(new BigNumber(prize_nft_information.royalties || 0))
          .dividedBy(100)
          .decimalPlaces(0, BigNumber.ROUND_FLOOR);

  const finalAmount = totalPrice
    .minus(platformFee)
    .minus(royalties)
    .decimalPlaces(0, BigNumber.ROUND_FLOOR);

  const auto_draw_fees = new BigNumber(0.0002).multipliedBy(maxTickets);
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <button
        onClick={showModal}
        disabled={!address || count >= 4}
        className='dinoButton'
      >
        {t('lotteries:create_lottery_count', { count: count })}
      </button>

      <Modal
        title={t('lotteries:create_lottery')}
        open={visible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form layout='vertical' onFinish={handleCreate}>
          {t('lotteries:winning_prize')}
          <div
            style={{
              border: '1px solid rgb(92 129 128)',
              padding: '10px'
            }}
          >
            <Form.Item
              name={'tokenPrizeType'}
              label={t('lotteries:token_type')}
              tooltip={t('lotteries:token_prize_tooltip')}
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
                <Radio value='Esdt'>ESDT</Radio>
                <Radio value='Egld'>EGLD</Radio>
                <Radio value='Sft'>SFT</Radio>
                <Radio value='Nft'>NFT</Radio>
              </Radio.Group>
            </Form.Item>{' '}
            {/* Selection du PRIZE */}
            {['Esdt', 'Sft', 'Nft'].includes(prizeType) && (
              <Form.Item
                name={'prizeIdentifier' + prizeType}
                label={t('lotteries:identifier')}
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
                      datas?.datas?.collection
                        ? datas?.datas?.collection
                        : datas?.datas?.identifier
                        ? datas?.datas?.identifier
                        : ''
                    );
                    setPrizeNonce(
                      datas?.datas?.nonce ? datas?.datas?.nonce : 0
                    );
                    setPrizeDecimals(
                      datas?.datas?.decimals ? datas?.datas?.decimals : 0
                    );
                    setPrizeBalance(new BigNumber(datas?.datas?.balance));
                    setPrizeAmount(new BigNumber(prizeType === 'Nft' ? 1 : 0));
                    setPrizeDisplay(prizeType === 'Nft' ? '1' : '');
                  }}
                  showSearch={true}
                  placeholder={t('lotteries:identifier_placeholder')}
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
                          {t('lotteries:disable_keyboard')}
                        </button>
                      ) : (
                        <button onClick={enableKeyboard}>
                          {t('lotteries:enable_keyboard')}
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
                  {prizeType === 'Esdt' &&
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
                        {/* {JSON.stringify(token)} */}
                      </Select.Option>
                    ))}{' '}
                  {prizeType === 'Sft' &&
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
                  {prizeType === 'Nft' &&
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
            {prizeIdentifier && ['Nft', 'Sft'].includes(prizeType) && (
              <NftDisplay nftInfo={prize_nft_information} amount={0} />
            )}{' '}
            {/* Montant du PRIZE */}{' '}
            {['Esdt', 'Sft', 'Egld'].includes(prizeType) && (
              <Form.Item
                name='prizeAmount'
                label={t('lotteries:quantity')}
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
                  disabled={prizeType === 'Nft' || acceptConditions}
                />
              </Form.Item>
            )}
          </div>
          {t('lotteries:ticket_price')}
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
                  label={t('lotteries:token_type')}
                  tooltip={t('lotteries:token_price_tooltip')}
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
                    value={priceType}
                  >
                    <Radio value='Esdt'>ESDT</Radio>
                    <Radio value='Egld'>EGLD</Radio>
                    <Radio value='Sft'>SFT</Radio>
                    {/* <Checkbox
                      value={isFree}
                      checked={isFree}
                      onChange={handleIsFree}
                    >
                      {t('lotteries:free')}
                    </Checkbox> */}
                    <Checkbox
                      value={isLocked}
                      checked={isLocked}
                      onChange={handleIsLocked}
                    >
                      {t('lotteries:locked')}
                    </Checkbox>
                  </Radio.Group>{' '}
                  {/* {isFree && (
                    <div style={{ color: 'red', marginTop: '10px' }}>
                      {t('lotteries:free_warning')}
                    </div>
                  )}{' '} */}
                  {/* {isLocked && (
                    <div className='lottery-info'>
                      <Trans
                        i18nKey='lotteries:locked_warning'
                        components={{ br: <br /> }}
                      />
                    </div>
                  )} */}
                </Form.Item>
                {/* Selection du PRICE */}
                {['Esdt', 'Sft'].includes(priceType) && (
                  <Form.Item
                    name={'priceIdentifier' + priceType}
                    label={t('lotteries:identifier')}
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
                      value={priceIdentifier}
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
                      placeholder={t('lotteries:identifier_placeholder')}
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
                              {t('lotteries:disable_keyboard')}
                            </button>
                          ) : (
                            <button onClick={enableKeyboard}>
                              {t('lotteries:enable_keyboard')}
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
                          disabled={
                            [xgraou_identifier, graou_identifier].includes(
                              token.identifier
                            ) && !isFree
                          }
                        >
                          {token.identifier}
                        </Select.Option>
                      ))}{' '}
                    </Select>
                  </Form.Item>
                )}
                {/* Photo du PRICE */}
                {priceIdentifier && ['Nft', 'Sft'].includes(priceType) && (
                  <NftDisplay nftInfo={price_nft_information} amount={0} />
                )}{' '}
                {/* Montant du PRICE */}
                {['Esdt', 'Sft', 'Egld'].includes(priceType) && (
                  <Form.Item
                    name='priceAmount'
                    label={t('lotteries:quantity')}
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
                {isFree && (
                  <div className='lottery-info'>
                    {t('lotteries:free_warning')}
                  </div>
                )}{' '}
                {isLocked && (
                  <div className='lottery-info'>
                    <Trans
                      i18nKey='lotteries:locked_warning'
                      components={{ br: <br /> }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          {t('lotteries:settings')}
          <div
            style={{
              border: '1px solid rgb(92 129 128)',
              padding: '10px'
            }}
          >
            {prizeIdentifier &&
              prizeAmount.isGreaterThan(0) &&
              priceIdentifier &&
              priceAmount.isGreaterThan(0) && (
                <>
                  {' '}
                  <Form.Item
                    name='startTime'
                    label={t('lotteries:start')}
                    tooltip={t('lotteries:leave_empty_start')}
                    rules={[
                      {
                        required: false,
                        message: 'Please select the start time!'
                      }
                    ]}
                  >
                    <DatePicker
                      showTime
                      placeholder={t('lotteries:select_date')}
                      onChange={handleStart}
                      popupClassName='custom-datepicker'
                      onFocus={(e) => e.target.blur()}
                      inputMode='none'
                      readOnly={true}
                      minDate={dayjs()}
                      maxDate={dayjs().add(30, 'days')}
                    />
                  </Form.Item>
                  <Form.Item
                    name='endTime'
                    label={t('lotteries:end')}
                    tooltip={t('lotteries:leave_empty_end')}
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
                      minDate={startTime > 0 ? dayjs.unix(startTime) : dayjs()}
                      maxDate={
                        isLocked
                          ? startTime > 0
                            ? dayjs.unix(startTime).add(30, 'day')
                            : dayjs().add(30, 'day')
                          : startTime > 0
                          ? dayjs.unix(startTime).add(6 * 30, 'days')
                          : dayjs().add(6, 'months')
                      }
                      // disabled={isLocked}
                    />
                  </Form.Item>
                  <Form.Item
                    name='maxTickets'
                    label={t('lotteries:total_tickets')}
                    help={t('lotteries:minimum_and_maximum', {
                      min: '4',
                      max: isLocked ? '50' : '100'
                    })}
                    tooltip={t('lotteries:total_tickets_tooltip')}
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
                      max={isLocked ? 50 : 100}
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
                  {maxTickets > 50 && (
                    <>
                      {' '}
                      <div style={{ color: 'red', marginTop: '10px' }}>
                        {t('lotteries:cannot_cancel')}
                      </div>
                    </>
                  )}
                  <Form.Item
                    name='maxPerWallet'
                    label={t('lotteries:max_per_wallet')}
                    tooltip={t('lotteries:leave_zero')}
                    help={t('lotteries:max_per_wallet_help')}
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
                    name='feePercentage'
                    label={t('lotteries:fee_percentage')}
                    tooltip={t('lotteries:fee_percentage_tooltip')}
                    // help={t('lotteries:minimum_and_maximum', {
                    //   min: '0.5%',
                    //   max: '0.5%'
                    // })}
                    // rules={[
                    //   {
                    //     required: false,
                    //     message: 'Please input the fee percentage!'
                    //   }
                    // ]}
                  >
                    {/* {' '}
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
                    /> */}{' '}
                    {isLocked ? (
                      <div>
                        <p>
                          {' '}
                          <p>{t('lotteries:graou_create_fee')}</p>
                        </p>
                        {autoDraw && (
                          <p>
                            {t('lotteries:auto_draw_fee')}{' '}
                            {auto_draw_fees.toFixed()} EGLD
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <p>{t('lotteries:graou_create_fee')}</p>
                        {autoDraw && (
                          <p>
                            {t('lotteries:auto_draw_fee')}{' '}
                            {auto_draw_fees.toFixed()} EGLD
                          </p>
                        )}
                        {}
                        {/* Total:{' '}
                        {formatAmount({
                          input: totalPrice?.toFixed(),
                          decimals: priceDecimals,
                          digits: 2,
                          showLastNonZeroDecimal: true,
                          addCommas: true
                        })}{' '} */}
                        {priceType != 'Sft' && (
                          <p>
                            {t('lotteries:platform_fee')} ({feePercentage} %):{' '}
                            {formatAmount({
                              input: platformFee.isGreaterThan(0)
                                ? platformFee.toFixed()
                                : '0',
                              decimals: priceDecimals || 0,
                              digits: 2,
                              showLastNonZeroDecimal: true,
                              addCommas: true
                            })}
                          </p>
                        )}{' '}
                        {prize_nft_information.royalties &&
                          priceType != 'Sft' && (
                            <p>
                              {t('lotteries:royalty_fee')} (
                              {prize_nft_information.royalties} %):{' '}
                              {formatAmount({
                                input: royalties.isGreaterThan(0)
                                  ? royalties.toFixed()
                                  : '0',
                                decimals: priceDecimals || 0,
                                digits: 2,
                                showLastNonZeroDecimal: true,
                                addCommas: true
                              })}{' '}
                            </p>
                          )}{' '}
                        {/* <br /> totalPrice:
                        {totalPrice.toFixed()}
                        <br />
                        platformFee:
                        {platformFee.toFixed()}
                        <br />
                        royalties: {royalties.toFixed()}
                        <br />
                        finalAmount: {finalAmount.toFixed()}
                        <br /> */}
                        {t('lotteries:vendor_amount')}:{' '}
                        {formatAmount({
                          input: finalAmount.isGreaterThan(0)
                            ? finalAmount.toFixed()
                            : '0',
                          decimals: priceDecimals || 0,
                          digits: 2,
                          showLastNonZeroDecimal: true,
                          addCommas: true
                        })}{' '}
                        {priceIdentifier == 'EGLD-000000'
                          ? 'EGLD'
                          : priceIdentifier}{' '}
                      </>
                    )}
                  </Form.Item>
                </>
              )}
          </div>

          {prizeIdentifier &&
            prizeAmount.isGreaterThan(0) &&
            priceIdentifier &&
            priceAmount.isGreaterThan(0) && (
              <>
                <Form.Item
                  name='acceptConditions'
                  valuePropName='checked'
                  rules={[]}
                >
                  <Checkbox
                    disabled={!cost_graou || payWith == 'EGLD'}
                    onChange={() => (
                      setAcceptConditions(!acceptConditions),
                      setPayWith(payWith == 'GRAOU' ? '' : 'GRAOU')
                    )}
                  >
                    {' '}
                    {!cost_graou ? (
                      <Trans
                        i18nKey='lotteries:you_need_x_graou'
                        values={{ x: 500 }}
                        components={{
                          bold: <b />,
                          link1: (
                            <a
                              style={{ color: 'blue' }}
                              href='https://xoxno.com/collection/DINOVOX-cb2297'
                              target='_blank'
                              rel='noopener noreferrer'
                            />
                          ),
                          link2: (
                            <a
                              style={{ color: 'blue' }}
                              href='https://www.dinovox.com/fr/staking'
                              target='_blank'
                              rel='noopener noreferrer'
                            />
                          )
                        }}
                      />
                    ) : (
                      t('lotteries:pay_x_start', {
                        x: 500,
                        token: 'XGRAOU'
                      })
                    )}
                  </Checkbox>
                  <Checkbox
                    disabled={payWith == 'GRAOU'}
                    onChange={() => (
                      setAcceptConditions(!acceptConditions),
                      setPayWith(payWith == 'EGLD' ? '' : 'EGLD')
                    )}
                  >
                    {' '}
                    {!cost_egld ? (
                      <Trans
                        i18nKey='lotteries:you_need_x_egld'
                        values={{ x: 0.25 }}
                        components={{
                          bold: <b />,
                          link1: (
                            <a
                              style={{ color: 'blue' }}
                              href='https://xoxno.com/collection/DINOVOX-cb2297'
                              target='_blank'
                              rel='noopener noreferrer'
                            />
                          ),
                          link2: (
                            <a
                              style={{ color: 'blue' }}
                              href='https://www.dinovox.com/fr/staking'
                              target='_blank'
                              rel='noopener noreferrer'
                            />
                          )
                        }}
                      />
                    ) : (
                      t('lotteries:pay_x_start', {
                        x: 0.25,
                        token: 'EGLD'
                      })
                    )}
                  </Checkbox>
                  <Checkbox
                    disabled={isLocked}
                    value={autoDraw}
                    checked={autoDraw}
                    onChange={() => setAutoDraw(!autoDraw)}
                  >
                    {' '}
                    <span>{t('lotteries:auto_draw')}</span>
                    <span className='tooltip-inline'>
                      (ℹ)
                      <span className='tooltiptext-inline'>
                        {t('lotteries:auto_draw_tooltip')}
                      </span>
                    </span>{' '}
                  </Checkbox>
                </Form.Item>
                <Form.Item>
                  {/* {prizeTicker} */}
                  <ActionCreate
                    prize_type={prizeType}
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
                    //
                    price_type={priceType}
                    is_free={isFree}
                    is_locked={isLocked}
                    auto_draw={autoDraw}
                    //
                    fee_percentage={Math.ceil(feePercentage * 100)}
                    acceptConditions={acceptConditions}
                    pay_with={payWith}
                    disabled={!acceptConditions || (!cost_graou && !cost_egld)}
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
