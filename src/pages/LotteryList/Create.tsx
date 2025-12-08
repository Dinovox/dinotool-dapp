import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  CheckboxChangeEvent,
  Steps
} from 'antd';

import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import { useGetUserNFT } from 'helpers/useGetUserNft';
import { useGetAccountInfo, formatAmount } from 'lib';
import { ActionCreate } from './Transaction/ActionCreate';
import BigNumber from 'bignumber.js';
import { graou_identifier, lottery_cost, xgraou_identifier } from 'config';
import NftDisplay from './NftDisplay';
import { useGetNftInformations } from './Transaction/helpers/useGetNftInformation';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { Trans, useTranslation } from 'react-i18next';
import {
  useGetEsdtInformations,
  FormatAmount
} from 'helpers/api/useGetEsdtInformations';

const CreateLotteryModal: React.FC<{
  count: string;
  cost_graou: boolean;
  cost_egld: boolean;
}> = ({ count, cost_graou, cost_egld }: any) => {
  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const [visible, setVisible] = useState(false);

  const [isLocked, setIsLocked] = useState(false);
  const [autoDraw, setAutoDraw] = useState(true);
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

  const [prizeDisplay, setPrizeDisplay] = useState('1'); // Valeur affichée à l'utilisateur
  const [prizeAmount, setPrizeAmount] = useState(new BigNumber(1)); // Valeur en traitement
  const [priceDisplay, setPriceDisplay] = useState('1'); // Valeur affichée à l'utilisateur
  const [priceAmount, setPriceAmount] = useState(new BigNumber(1));

  const [prizeNonce, setPrizeNonce] = useState<number>(0);
  const [prizeDecimals, setPrizeDecimals] = useState<number>(0);
  const [prizeTicker, setPrizeTicker] = useState<string>('');
  const [priceTicker, setPriceTicker] = useState<string>('');
  const [prizeBalance, setPrizeBalance] = useState<BigNumber>(new BigNumber(0));
  const [payWith, setPayWith] = useState('');
  const [checked, setChecked] = useState(false);
  // test for manual input (not from dropdown)
  const [priceValid, setPriceValid] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

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
      form.setFieldsValue({ prizeAmount: '1', prizeIdentifier: '' });
      setPrizeBalance(new BigNumber(1));
    } else if (e.target.value === 'Egld') {
      setPrizeType('Egld');
      setPrizeIdentifier('EGLD-000000');
      setPrizeTicker('EGLD-000000');
      setPrizeNonce(0);
      setPrizeDecimals(18);
      setPrizeAmount(new BigNumber(1));
      setPrizeDisplay('1');
      form.setFieldsValue({ prizeAmount: '1', prizeIdentifier: 'EGLD-000000' });
      setPrizeBalance(new BigNumber(account?.balance));
    } else if (e.target.value === 'Sft') {
      setPrizeType(e.target.value);
      setPrizeIdentifier('');
      setPrizeTicker('');
      setPrizeNonce(0);
      setPrizeDecimals(0);
      setPrizeAmount(new BigNumber(1));
      setPrizeDisplay('1');
      form.setFieldsValue({ prizeAmount: '1', prizeIdentifier: '' });
      setPrizeBalance(new BigNumber(0));
    } else {
      setPrizeType(e.target.value);
      setPrizeIdentifier('');
      setPrizeTicker('');
      setPrizeNonce(0);
      setPrizeDecimals(0);
      setPrizeAmount(new BigNumber(0));
      setPrizeDisplay('');
      form.setFieldsValue({ prizeAmount: '', prizeIdentifier: '' });
      setPrizeBalance(new BigNumber(0));
    }
  };

  //EGLD/SFT/ESDT
  const handlePriceType = (e: any) => {
    if (e.target.value === 'Egld') {
      setPriceType('Egld');
      setPriceIdentifier('EGLD-000000');
      setPriceTicker('EGLD-000000');
      setPriceDecimals(18);
      setPriceAmount(new BigNumber(1));
      setPriceDisplay('1');
      form.setFieldsValue({ priceAmount: '1', priceIdentifier: 'EGLD-000000' });
    } else if (e.target.value === 'Sft') {
      setPriceType(e.target.value);
      setPriceTicker('');
      setPriceIdentifier('');
      setPriceDecimals(0);
      setPriceAmount(new BigNumber(1));
      setPriceDisplay('1');
      form.setFieldsValue({ priceAmount: '1', priceIdentifier: '' });
    } else {
      setPriceType(e.target.value);
      setPriceTicker('');
      setPriceIdentifier('');
      setPriceDecimals(0);
      setPriceAmount(new BigNumber(0));
      setPriceDisplay('');
      form.setFieldsValue({ priceAmount: '', priceIdentifier: '' });
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

  const price_esdt_information = useGetEsdtInformations(
    priceIdentifier,
    priceType
  );

  useEffect(() => {
    const fetchPriceEsdtInformation = async () => {
      if (priceNonce == 0 && ['Esdt'].includes(priceType) && checked) {
        if (
          priceIdentifier &&
          priceValid &&
          price_esdt_information?.type == 'FungibleESDT'
        ) {
          setPriceDecimals(price_esdt_information.decimals);
          setPriceValid(true);
        } else {
          setPriceValid(false);
        }
      }
    };

    fetchPriceEsdtInformation();
  }, [price_esdt_information, checked]);

  const handleStart = (date: dayjs.Dayjs | null) => {
    setStartTime(date ? date.unix() : 0); // Convertit en timestamp Unix (secondes)
  };

  const handleEnd = (date: dayjs.Dayjs | null) => {
    setEndTime(date ? date.unix() : 0); // Convertit en timestamp Unix (secondes)
    setAutoDraw(true);
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

    // REMOVED: Strict balance check that was preventing manual input
    // if (
    //   convertedValue.isGreaterThan(prizeBalance) &&
    //   ['Sft', 'Esdt', 'Egld'].includes(prizeType)
    // ) {
    //   convertedValue = new BigNumber(prizeBalance);
    //   setPrizeDisplay(
    //     prizeBalance.dividedBy(10 ** prizeDecimals).toFixed(prizeDecimals)
    //   );
    // }

    setPrizeAmount(convertedValue); // Stocke la valeur en BigNumber
  };

  const handlePriceAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(',', '.');

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

  //locked = free
  function handleIsLocked(e: CheckboxChangeEvent): void {
    const checked = e.target.checked;
    setAutoDraw(checked);
    setIsLocked(checked);
    if (checked) {
      setPriceAmount(new BigNumber(0));
      setPriceDisplay('');
      form.setFieldsValue({ priceAmount: '' });
    }
    if (!priceIdentifier) {
      // setPriceType(checked ? 'Esdt' : '');
      // setPriceIdentifier(checked ? graou_identifier : '');
      // setPriceTicker(checked ? graou_identifier : '');
      // setPriceDecimals(checked ? 18 : 0);
      // setPriceAmount(new BigNumber(checked ? 100 * 10 ** 18 : 0));
      // setPriceDisplay(checked ? '100' : '');
      // setPriceNonce(0);
    }
    setMaxPerWallet(checked ? 1 : 0);
    setMaxTickets(maxTickets > 50 ? 50 : maxTickets);
  }

  const totalPrice = isLocked
    ? new BigNumber(0)
    : new BigNumber(priceAmount.multipliedBy(maxTickets) || 0);

  const platformFee =
    priceType === 'Nft' || priceType === 'Sft' || isLocked
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
    priceType === 'Nft' || priceType === 'Sft' || isLocked
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

  function splitIdentifier(identifier: string) {
    const parts = identifier.split('-');

    if (parts.length === 3) {
      const [prefix, mid, suffix] = parts;
      return {
        ticker: `${prefix}-${mid}`,
        nonce: parseInt(suffix, 16),
        is_valid: mid.length == 6 ? true : false
      };
    }
    if (parts.length === 2) {
      const [prefix, mid] = parts;
      setPriceValid(mid.length == 6 ? true : false);
      return {
        ticker: `${prefix}-${mid}`,
        nonce: 0,
        is_valid: mid.length == 6 ? true : false
      };
    }
    return {
      ticker: identifier,
      nonce: 0,
      is_valid: false
    };
  }
  const isStep1Valid = useMemo(() => {
    if (!prizeType) return false;
    if (['Esdt', 'Sft', 'Nft'].includes(prizeType) && !prizeIdentifier)
      return false;
    if (
      ['Esdt', 'Sft', 'Egld'].includes(prizeType) &&
      (!prizeAmount || prizeAmount.lte(0))
    )
      return false;
    return true;
  }, [prizeType, prizeIdentifier, prizeAmount]);

  const isStep2Valid = useMemo(() => {
    if (!priceType) return false;
    if (['Esdt', 'Sft'].includes(priceType) && !priceIdentifier) return false;
    if (
      ['Esdt', 'Sft', 'Egld'].includes(priceType) &&
      (!priceAmount || priceAmount.lte(0))
    )
      return false;
    return priceValid;
  }, [priceType, priceIdentifier, priceAmount, priceValid]);

  if (!address) {
    return null;
  }

  return (
    <div className='flex justify-center'>
      <button
        onClick={showModal}
        disabled={
          !address ||
          (count >= 4 &&
            address !=
              'erd1x5zq82l0whpawgr53k6y63xh5jq2649k99q49s0508s82w25ytsq7f89my')
        }
        className='dinoButton'
      >
        {t('lotteries:create_lottery_count', { count: count })}
      </button>

      <Modal
        title={
          <div className='text-xl font-bold text-gray-800 dark:text-white mb-4'>
            {t('lotteries:create_lottery')}
          </div>
        }
        open={visible}
        onCancel={handleCancel}
        footer={null}
        width={800}
        className='custom-modal'
      >
        <Form
          layout='vertical'
          form={form}
          onFinish={handleCreate}
          className='space-y-6'
        >
          <Steps
            current={currentStep}
            className='mb-8'
            items={[
              {
                title: t('lotteries:winning_prize'),
                icon: <span className='text-xl'>🏆</span>
              },
              {
                title: t('lotteries:ticket_price'),
                icon: <span className='text-xl'>🎟️</span>
              },
              {
                title: t('lotteries:settings'),
                icon: <span className='text-xl'>⚙️</span>
              }
            ]}
          />

          {/* Winning Prize Section */}
          {currentStep === 0 && (
            <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50'>
              <h3 className='text-xl font-bold mb-6 text-gray-800 flex items-center gap-3'>
                🏆 {t('lotteries:winning_prize')}
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Form.Item
                  name={'tokenPrizeType'}
                  label={
                    <span className='font-medium'>
                      {t('lotteries:token_type')}
                    </span>
                  }
                  tooltip={t('lotteries:token_prize_tooltip')}
                  className='mb-2'
                >
                  <Radio.Group
                    onChange={handlePrizeType}
                    className='w-full flex'
                    buttonStyle='solid'
                  >
                    <Radio.Button value='Esdt' className='flex-1 text-center'>
                      ESDT
                    </Radio.Button>
                    <Radio.Button value='Egld' className='flex-1 text-center'>
                      EGLD
                    </Radio.Button>
                    <Radio.Button value='Sft' className='flex-1 text-center'>
                      SFT
                    </Radio.Button>
                    <Radio.Button value='Nft' className='flex-1 text-center'>
                      NFT
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>

                {['Esdt', 'Sft', 'Nft'].includes(prizeType) && (
                  <Form.Item
                    name='prizeIdentifier'
                    label={
                      <span className='font-medium'>
                        {t('lotteries:identifier')}
                      </span>
                    }
                    className='mb-2'
                  >
                    <Select
                      className='w-full'
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
                        setPrizeAmount(
                          new BigNumber(prizeType === 'Nft' ? 1 : prizeAmount)
                        );
                        setPrizeDisplay(
                          prizeType === 'Nft' ? '1' : prizeDisplay
                        );
                        form.setFieldsValue({
                          prizeAmount: prizeType === 'Nft' ? '1' : prizeDisplay
                        });
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
                          {keyboardEnabled ? (
                            <button
                              onClick={disableKeyboard}
                              className='w-full p-2 text-sm text-blue-500 hover:bg-blue-50'
                            >
                              {t('lotteries:disable_keyboard')}
                            </button>
                          ) : (
                            <button
                              onClick={enableKeyboard}
                              className='w-full p-2 text-sm text-blue-500 hover:bg-blue-50'
                            >
                              {t('lotteries:enable_keyboard')}
                            </button>
                          )}
                          {menu}
                          <Divider style={{ margin: '8px 0' }} />
                          <Input
                            value={prizeIdentifier}
                            className='p-2'
                            placeholder='Manual input...'
                            onChange={(e) => {
                              const value = (e.target as HTMLInputElement)
                                .value;
                              setPrizeIdentifier(value);
                              setPrizeNonce(0);
                              setPrizeDecimals(0);
                              // setPrizeAmount(new BigNumber(0));
                              // setPrizeDisplay('');
                              form.setFieldsValue({ prizeAmount: '' });
                            }}
                          />
                        </>
                      )}
                    >
                      {prizeType === 'Esdt' &&
                        user_esdt.map((token: any) => (
                          <Select.Option
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
                        ))}
                      {prizeType === 'Sft' &&
                        prize_options_sft.map((token: any) => (
                          <Select.Option
                            key={token.identifier}
                            value={token.identifier}
                            datas={token}
                          >
                            {token.identifier}
                          </Select.Option>
                        ))}
                      {prizeType === 'Nft' &&
                        prize_options_nft.map((token: any) => (
                          <Select.Option
                            key={token.identifier}
                            value={token.identifier}
                            datas={token}
                          >
                            {token.identifier}
                          </Select.Option>
                        ))}
                    </Select>
                  </Form.Item>
                )}
              </div>

              {/* Photo du PRIZE */}
              {prizeIdentifier && ['Nft', 'Sft'].includes(prizeType) && (
                <div className='mt-4 flex justify-center'>
                  <div className='w-32 h-32 rounded-lg overflow-hidden shadow-md'>
                    <NftDisplay nftInfo={prize_nft_information} amount={0} />
                  </div>
                </div>
              )}

              {/* Montant du PRIZE */}
              {['Esdt', 'Sft', 'Egld'].includes(prizeType) && (
                <div className='mt-4'>
                  <Form.Item
                    name='prizeAmount'
                    label={
                      <span className='font-medium'>
                        {t('lotteries:quantity')}
                      </span>
                    }
                    className='mb-2'
                  >
                    <Input
                      type='number'
                      inputMode='decimal'
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      value={prizeDisplay}
                      onChange={handlePrizeAmountChange}
                      disabled={prizeType === 'Nft'}
                      className='w-full rounded-md border-gray-300'
                      suffix={
                        <span className='text-gray-500 text-xs'>
                          {prizeTicker == 'EGLD-000000'
                            ? 'EGLD'
                            : prizeTicker || prizeType}
                        </span>
                      }
                    />
                  </Form.Item>
                  {prizeAmount.isGreaterThan(1) &&
                    ['Sft'].includes(prizeType) && (
                      <div className='text-amber-500 text-sm mt-1'>
                        ⚠️ {t('lotteries:only_one_winner_warning')}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* Ticket Price Section */}
          {currentStep === 1 && (
            <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50'>
              <h3 className='text-xl font-bold mb-6 text-gray-800 flex items-center gap-3'>
                🎟️ {t('lotteries:ticket_price')}
              </h3>

              {prizeIdentifier && prizeAmount.isGreaterThan(0) && (
                <>
                  <Form.Item
                    name='tokenPriceType'
                    label={
                      <span className='font-medium'>
                        {t('lotteries:token_type')}
                      </span>
                    }
                    tooltip={t('lotteries:token_price_tooltip')}
                    className='mb-4'
                  >
                    <div className='flex flex-col gap-3'>
                      <Radio.Group
                        onChange={handlePriceType}
                        defaultValue={priceType}
                        value={priceType}
                        className='w-full flex'
                        buttonStyle='solid'
                      >
                        <Radio.Button
                          value='Esdt'
                          className='flex-1 text-center'
                        >
                          ESDT
                        </Radio.Button>
                        <Radio.Button
                          value='Egld'
                          className='flex-1 text-center'
                        >
                          EGLD
                        </Radio.Button>
                        <Radio.Button
                          value='Sft'
                          className='flex-1 text-center'
                        >
                          SFT
                        </Radio.Button>
                      </Radio.Group>

                      <div className='flex gap-4'>
                        <Checkbox
                          value={isLocked}
                          checked={isLocked}
                          onChange={handleIsLocked}
                          className='font-medium'
                        >
                          🔒 {t('lotteries:locked')}
                        </Checkbox>
                      </div>
                    </div>
                  </Form.Item>

                  {['Esdt', 'Sft'].includes(priceType) && (
                    <Form.Item
                      validateStatus={!priceValid ? 'error' : ''}
                      name='priceIdentifier'
                      label={
                        <span className='font-medium'>
                          {t('lotteries:identifier')}
                        </span>
                      }
                      className='mb-4'
                    >
                      <Select
                        defaultValue={priceIdentifier}
                        value={priceIdentifier}
                        className='w-full'
                        onDropdownVisibleChange={handleDropdownChange}
                        onChange={(value, datas: any) => {
                          setPriceValid(true);
                          disableKeyboard();
                          setPriceIdentifier(value);
                          setPriceTicker(
                            priceType === 'Esdt'
                              ? datas?.datas?.identifier
                              : datas?.datas?.collection
                              ? datas?.datas?.collection
                              : ''
                          );
                          setPriceNonce(
                            datas?.datas?.nonce > 0 ? datas?.datas?.nonce : 0
                          );
                          setPriceDecimals(
                            datas?.datas?.decimals ? datas?.datas?.decimals : 0
                          );
                          setPriceAmount(
                            new BigNumber(priceType === 'Sft' ? 1 : 0)
                          );
                          setPriceDisplay(priceType === 'Sft' ? '1' : '0');
                          form.setFieldsValue({
                            priceAmount: priceType === 'Sft' ? '1' : '0'
                          });
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
                            {keyboardEnabled ? (
                              <button
                                onClick={disableKeyboard}
                                className='w-full p-2 text-sm text-blue-500 hover:bg-blue-50'
                              >
                                {t('lotteries:disable_keyboard')}
                              </button>
                            ) : (
                              <button
                                onClick={enableKeyboard}
                                className='w-full p-2 text-sm text-blue-500 hover:bg-blue-50'
                              >
                                {t('lotteries:enable_keyboard')}
                              </button>
                            )}
                            {menu}
                            <Divider style={{ margin: '8px 0' }} />
                            <Input
                              value={priceIdentifier}
                              className='p-2'
                              placeholder='Manual input...'
                              onChange={(e) => {
                                const value = (e.target as HTMLInputElement)
                                  .value;
                                setPriceIdentifier(value);
                                const splited = splitIdentifier(value);
                                if (splited.is_valid) {
                                  setChecked(true);
                                  setPriceTicker(splited.ticker);
                                  setPriceNonce(splited.nonce);
                                  setPriceDecimals(0);
                                  setPriceValid(true);
                                } else {
                                  setPriceValid(false);
                                  setPriceTicker('');
                                  setPriceNonce(0);
                                  setPriceDecimals(0);
                                }
                                setPriceAmount(new BigNumber(0));
                                setPriceDisplay('');
                                form.setFieldsValue({ priceAmount: '' });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const value = (e.target as HTMLInputElement)
                                    .value;
                                  setPriceIdentifier(value);
                                  const splited = splitIdentifier(value);
                                  if (splited.is_valid) {
                                    setChecked(true);
                                    setPriceTicker(splited.ticker);
                                    setPriceNonce(splited.nonce);
                                    setPriceDecimals(0);
                                    setPriceValid(true);
                                    if (
                                      document.activeElement instanceof
                                      HTMLElement
                                    ) {
                                      document.activeElement.blur();
                                    }
                                  } else {
                                    setPriceValid(false);
                                    setPriceTicker('');
                                    setPriceNonce(0);
                                    setPriceDecimals(0);
                                  }
                                }
                              }}
                            />
                          </>
                        )}
                      >
                        {price_options.map((token: any) => (
                          <Select.Option
                            key={token.identifier}
                            value={token.identifier}
                            datas={token}
                            disabled={
                              [xgraou_identifier, graou_identifier].includes(
                                token.identifier
                              ) && !isLocked
                            }
                          >
                            {token.identifier}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  )}

                  {priceIdentifier && ['Nft', 'Sft'].includes(priceType) && (
                    <div className='mt-4 flex justify-center'>
                      <div className='w-32 h-32 rounded-lg overflow-hidden shadow-md'>
                        <NftDisplay
                          nftInfo={price_nft_information}
                          amount={0}
                        />
                      </div>
                    </div>
                  )}

                  {['Esdt', 'Sft', 'Egld'].includes(priceType) && (
                    <Form.Item
                      name='priceAmount'
                      label={
                        <span className='font-medium'>
                          {t('lotteries:quantity')}
                        </span>
                      }
                      className='mb-2'
                    >
                      <Input
                        type='number'
                        inputMode='decimal'
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        value={priceDisplay}
                        onChange={handlePriceAmountChange}
                        className='w-full rounded-md border-gray-300'
                        suffix={
                          <span className='text-gray-500 text-xs'>
                            {priceTicker == 'EGLD-000000'
                              ? 'EGLD'
                              : priceTicker || priceType}
                          </span>
                        }
                      />
                    </Form.Item>
                  )}

                  {isLocked && (
                    <div className='text-amber-600 bg-amber-50 p-3 rounded-md text-sm mt-2'>
                      {t('lotteries:free_warning')}
                    </div>
                  )}
                  {isLocked && (
                    <div className='text-blue-600 bg-blue-50 p-3 rounded-md text-sm mt-2'>
                      <Trans
                        i18nKey='lotteries:locked_warning'
                        components={{ br: <br /> }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Settings Section */}
          {currentStep === 2 && (
            <>
              <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50'>
                <h3 className='text-xl font-bold mb-6 text-gray-800 flex items-center gap-3'>
                  ⚙️ {t('lotteries:settings')}
                </h3>

                {prizeIdentifier &&
                  prizeAmount.isGreaterThan(0) &&
                  priceIdentifier &&
                  priceAmount.isGreaterThan(0) &&
                  priceValid && (
                    <div className='space-y-4'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <Form.Item
                          name='startTime'
                          label={
                            <span className='font-medium'>
                              {t('lotteries:start')}
                            </span>
                          }
                          tooltip={t('lotteries:leave_empty_start')}
                          className='mb-0'
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
                            className='w-full'
                          />
                        </Form.Item>
                        <Form.Item
                          name='endTime'
                          label={
                            <span className='font-medium'>
                              {t('lotteries:end')}
                            </span>
                          }
                          tooltip={t('lotteries:leave_empty_end')}
                          className='mb-0'
                        >
                          <DatePicker
                            showTime
                            onChange={handleEnd}
                            popupClassName='custom-datepicker'
                            onFocus={(e) => e.target.blur()}
                            inputMode='none'
                            readOnly={true}
                            minDate={
                              startTime > 0 ? dayjs.unix(startTime) : dayjs()
                            }
                            maxDate={
                              isLocked
                                ? startTime > 0
                                  ? dayjs.unix(startTime).add(30, 'day')
                                  : dayjs().add(30, 'day')
                                : startTime > 0
                                ? dayjs.unix(startTime).add(6 * 30, 'days')
                                : dayjs().add(6, 'months')
                            }
                            className='w-full'
                          />
                        </Form.Item>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <Form.Item
                          name='maxTickets'
                          label={
                            <span className='font-medium'>
                              {t('lotteries:total_tickets')}
                            </span>
                          }
                          help={t('lotteries:minimum_and_maximum', {
                            min: '4',
                            max: isLocked ? '50' : '100'
                          })}
                          tooltip={t('lotteries:total_tickets_tooltip')}
                          initialValue={20}
                          className='mb-0'
                        >
                          <div className='flex flex-col gap-2'>
                            <Input
                              type='number'
                              disabled={true}
                              value={maxTickets}
                              className='w-full text-center font-bold'
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
                                setMaxPerWallet((prev = 0) =>
                                  prev > maxTickets / 4
                                    ? Math.floor(maxTickets / 4)
                                    : prev
                                );
                              }}
                              className='w-full'
                            />
                          </div>
                        </Form.Item>

                        <Form.Item
                          name='maxPerWallet'
                          label={
                            <span className='font-medium'>
                              {t('lotteries:max_per_wallet')}
                            </span>
                          }
                          tooltip={t('lotteries:leave_zero')}
                          help={t('lotteries:max_per_wallet_help')}
                          initialValue={0}
                          className='mb-0'
                        >
                          <div className='flex flex-col gap-2'>
                            <Input
                              type='number'
                              disabled={true}
                              value={maxPerWallet}
                              className='w-full text-center font-bold'
                            />
                            <Input
                              type='range'
                              min={0}
                              max={Math.floor(maxTickets / 4)}
                              value={maxPerWallet}
                              onChange={(e) =>
                                setMaxPerWallet(parseInt(e.target.value, 10))
                              }
                              className='w-full'
                            />
                          </div>
                        </Form.Item>
                      </div>

                      {maxTickets > 50 && (
                        <div className='text-red-500 text-sm font-medium'>
                          ⚠️ {t('lotteries:cannot_cancel')}
                        </div>
                      )}

                      <Form.Item
                        name='feePercentage'
                        label={
                          <span className='font-medium'>
                            {t('lotteries:fee_percentage')}
                          </span>
                        }
                        tooltip={t('lotteries:fee_percentage_tooltip')}
                        className='mb-0'
                      >
                        <div className='bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-700'>
                          <div className='flex justify-between items-center mb-1'>
                            <span>{t('lotteries:graou_create_fee')}</span>
                          </div>

                          {autoDraw && (
                            <div className='flex justify-between items-center mb-1 text-blue-600 font-medium'>
                              <span>{t('lotteries:auto_draw_fee')}</span>
                              <span className='font-mono'>
                                {auto_draw_fees.toFixed()} EGLD
                              </span>
                            </div>
                          )}

                          {priceType != 'Sft' && !isLocked && (
                            <div className='flex justify-between items-center mb-1'>
                              <span>
                                {t('lotteries:platform_fee')} ({feePercentage}%)
                              </span>
                              <span className='font-mono'>
                                {formatAmount({
                                  input: platformFee.isGreaterThan(0)
                                    ? platformFee.toFixed()
                                    : '0',
                                  decimals: priceDecimals || 0,
                                  digits: 2,
                                  showLastNonZeroDecimal: true,
                                  addCommas: true
                                })}
                              </span>
                            </div>
                          )}

                          {prize_nft_information.royalties &&
                            priceType != 'Sft' &&
                            !isLocked && (
                              <div className='flex justify-between items-center mb-1'>
                                <span>
                                  {t('lotteries:royalty_fee')} (
                                  {prize_nft_information.royalties}%)
                                </span>
                                <span className='font-mono'>
                                  {formatAmount({
                                    input: royalties.isGreaterThan(0)
                                      ? royalties.toFixed()
                                      : '0',
                                    decimals: priceDecimals || 0,
                                    digits: 2,
                                    showLastNonZeroDecimal: true,
                                    addCommas: true
                                  })}
                                </span>
                              </div>
                            )}

                          <div className='border-t border-gray-200 my-2 pt-2 flex justify-between items-center font-bold text-base text-gray-900'>
                            <span>{t('lotteries:vendor_amount')}</span>
                            <span className='text-green-600'>
                              <FormatAmount
                                amount={
                                  isLocked
                                    ? '0'
                                    : finalAmount.isGreaterThan(0)
                                    ? finalAmount.toFixed()
                                    : '0'
                                }
                                identifier={priceIdentifier}
                                showLastNonZeroDecimal={true}
                              />
                            </span>
                          </div>
                        </div>
                      </Form.Item>
                    </div>
                  )}
              </div>

              {/* Confirmation Section */}
              {prizeIdentifier &&
                prizeAmount.isGreaterThan(0) &&
                priceIdentifier &&
                priceAmount.isGreaterThan(0) &&
                priceValid && (
                  <div className='bg-blue-50 p-6 rounded-2xl border border-blue-100'>
                    <Form.Item
                      name='acceptConditions'
                      valuePropName='checked'
                      className='mb-4'
                    >
                      <div className='flex flex-col gap-3'>
                        <Checkbox
                          disabled={!cost_graou || payWith == 'EGLD'}
                          checked={payWith == 'GRAOU'}
                          onChange={() =>
                            setPayWith(payWith == 'GRAOU' ? '' : 'GRAOU')
                          }
                          className='text-sm'
                        >
                          {!cost_graou ? (
                            <Trans
                              i18nKey='lotteries:you_need_x_graou'
                              values={{
                                x: new BigNumber(lottery_cost.graou)
                                  .div(1e18)
                                  .toFixed(2)
                              }}
                              components={{
                                bold: <b />,
                                link1: (
                                  <a
                                    className='text-blue-600 hover:underline'
                                    href='https://xoxno.com/collection/DINOVOX-cb2297'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                  />
                                ),
                                link2: (
                                  <a
                                    className='text-blue-600 hover:underline'
                                    href='https://www.dinovox.com/fr/staking'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                  />
                                )
                              }}
                            />
                          ) : (
                            t('lotteries:pay_x_start', {
                              x: new BigNumber(lottery_cost.graou)
                                .div(1e18)
                                .toFixed(2),
                              token: 'XGRAOU'
                            })
                          )}
                        </Checkbox>

                        <Checkbox
                          disabled={payWith == 'GRAOU'}
                          checked={payWith == 'EGLD'}
                          onChange={() =>
                            setPayWith(payWith == 'EGLD' ? '' : 'EGLD')
                          }
                          className='text-sm'
                        >
                          {!cost_egld ? (
                            <Trans
                              i18nKey='lotteries:you_need_x_egld'
                              values={{
                                x: new BigNumber(lottery_cost.egld)
                                  .div(1e18)
                                  .toFixed(2)
                              }}
                              components={{
                                bold: <b />,
                                link1: (
                                  <a
                                    className='text-blue-600 hover:underline'
                                    href='https://xoxno.com/collection/DINOVOX-cb2297'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                  />
                                ),
                                link2: (
                                  <a
                                    className='text-blue-600 hover:underline'
                                    href='https://www.dinovox.com/fr/staking'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                  />
                                )
                              }}
                            />
                          ) : (
                            t('lotteries:pay_x_start', {
                              x: new BigNumber(lottery_cost.egld)
                                .div(1e18)
                                .toFixed(2),
                              token: 'EGLD'
                            })
                          )}
                        </Checkbox>

                        <div className='flex items-center gap-2'>
                          <Checkbox
                            disabled={isLocked || endTime > 0}
                            value={autoDraw}
                            checked={autoDraw}
                            onChange={() => setAutoDraw(!autoDraw)}
                            className='font-medium'
                          >
                            {t('lotteries:auto_draw')}
                          </Checkbox>
                          <span
                            className='text-gray-400 text-xs cursor-help'
                            title={t('lotteries:auto_draw_tooltip')}
                          >
                            (ℹ)
                          </span>
                        </div>

                        {autoDraw && endTime > 0 && (
                          <div className='text-amber-500 text-xs ml-6'>
                            ⚠️ {t('lotteries:auto_draw_warning')}
                          </div>
                        )}
                      </div>
                    </Form.Item>

                    <div className='flex justify-end'>
                      <ActionCreate
                        prize_type={prizeType}
                        prize_identifier={prizeTicker}
                        prize_nonce={prizeNonce}
                        prize_decimals={prizeDecimals}
                        prize_amount={prizeAmount}
                        price_identifier={priceTicker}
                        price_nonce={priceNonce}
                        price_decimals={priceDecimals}
                        price_amount={priceAmount}
                        max_tickets={maxTickets}
                        max_per_wallet={maxPerWallet}
                        start_time={startTime}
                        end_time={endTime}
                        price_type={priceType}
                        is_locked={isLocked}
                        auto_draw={autoDraw}
                        fee_percentage={Math.ceil(feePercentage * 100)}
                        pay_with={payWith}
                        disabled={payWith === '' || (!cost_graou && !cost_egld)}
                      />
                    </div>
                  </div>
                )}
            </>
          )}

          <div className='flex justify-between mt-8 pt-4 border-t border-gray-100 dark:border-zinc-800'>
            {currentStep > 0 && (
              <button
                type='button'
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className='px-6 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 font-medium transition-all'
              >
                Back
              </button>
            )}
            {currentStep < 2 && (
              <button
                type='button'
                disabled={currentStep === 0 ? !isStep1Valid : !isStep2Valid}
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all ml-auto flex items-center gap-2 ${
                  (currentStep === 0 ? !isStep1Valid : !isStep2Valid)
                    ? 'bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-zinc-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30'
                }`}
              >
                Next ➜
              </button>
            )}
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CreateLotteryModal;
