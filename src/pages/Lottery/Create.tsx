import React, { useState } from 'react';
import { Checkbox, FormInstance } from 'antd';
import {
  Modal,
  Button,
  Form,
  Input,
  DatePicker,
  Radio,
  Select,
  Divider
} from 'antd';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import form from 'antd/es/form';
import { useGetUserNFT } from 'helpers/useGetUserNft';
import { useGetAccountInfo } from 'hooks';
import { ActionCreate } from './Transaction/ActionCreate';
import BigNumber from 'bignumber.js';
import bigNumToHex from 'helpers/bigNumToHex';

const CreateLotteryModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [priceType, setPriceType] = useState('');
  const [priceIdentifier, setPriceIdentifier] = useState('');
  const [priceAmount, setPriceAmount] = useState<number>(0);
  const [priceNonce, setPriceNonce] = useState<number>(0);
  const [priceDecimals, setPriceDecimals] = useState<number>(0);
  const [maxTickets, setMaxTickets] = useState<number>(20);
  const [maxPerWallet, setMaxPerWallet] = useState<number | undefined>(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [feePercentage, setFeePercentage] = useState<number>(0.1);
  const [prizeType, setPrizeType] = useState<string>('');
  const [prizeIdentifier, setPrizeIdentifier] = useState('');
  const [prizeAmount, setPrizeAmount] = useState<number>(0);
  const [prizeNonce, setPrizeNonce] = useState<number | undefined>(0);
  const [prizeDecimals, setPrizeDecimals] = useState<number>(0);
  const [acceptConditions, setAcceptConditions] = useState(false);
  const [prizeTicker, setPrizeTicker] = useState<string>('');

  const { address } = useGetAccountInfo();

  const user_esdt = useGetUserESDT();
  const user_sft = useGetUserNFT(address);

  const showModal = () => {
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleCreate = (values: any) => {
    console.log('Received values of form: ', values);
    setVisible(false);
  };

  const handlePriceType = (e: any) => {
    if (e.target.value === 'EGLD') {
      setPriceType('EGLD');
      setPriceIdentifier('EGLD-000000');
      setPriceNonce(0);
      setPriceDecimals(18);
      setPriceAmount(0);
    } else {
      setPriceType(e.target.value);
      setPriceIdentifier('');
      setPriceNonce(0);
      setPriceAmount(0);
    }
  };

  const handlePrizeType = (e: any) => {
    if (e.target.value === 'NFT') {
      setPrizeType(e.target.value);
      setPrizeIdentifier('');
      setPrizeTicker('');
      setPrizeNonce(0);
      setPrizeAmount(1);
    } else if (e.target.value === 'EGLD') {
      setPrizeType('EGLD');
      setPrizeIdentifier('EGLD-000000');
      setPrizeTicker('EGLD');
      setPrizeNonce(0);
      setPrizeDecimals(18);
      setPrizeAmount(0);
    } else {
      setPrizeType(e.target.value);
      setPrizeIdentifier('');
      setPrizeTicker('');
      setPrizeNonce(0);
      setPrizeAmount(0);
    }
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

  if (!address) {
    return null;
  }
  return (
    <>
      <Button type='primary' onClick={showModal}>
        Create Lottery
      </Button>
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
                  required: true,
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
            </Form.Item>
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
                  disabled={acceptConditions}
                  onChange={(value, datas: any) => {
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
                  }}
                  showSearch
                  placeholder='Select a token or enter manually'
                  optionFilterProp='children'
                  filterOption={(input, option) =>
                    String(option?.children ?? '')
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: '8px 0' }} />
                      <Input
                        disabled={acceptConditions}
                        value={priceIdentifier}
                        style={{ padding: '8px' }}
                        onChange={
                          (e) => {
                            const value = (e.target as HTMLInputElement).value;
                            setPriceIdentifier(value);
                            setPriceNonce(0);
                            setPriceDecimals(0);
                          }
                          //   const value = (e.target as HTMLInputElement).value;
                          //   if (value) {
                          //   }
                        }
                      />
                    </>
                  )}
                >
                  {''}
                  {prizeType === 'ESDT' &&
                    user_esdt.map((token: any) => (
                      <Select.Option
                        key={token.identifier}
                        value={token.identifier}
                        datas={token}
                      >
                        {token.identifier}
                      </Select.Option>
                    ))}{' '}
                  {prizeType === 'SFT' &&
                    prize_options_sft.map((token: any) => (
                      <Select.Option
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
            {['SFT', 'NFT'].includes(prizeType) && (
              <Form.Item name='prizeNonce' label='Nonce'>
                {' '}
                <Input type='text' value={prizeNonce} disabled />
              </Form.Item>
            )}
            {(prizeType == 'ESDT' || prizeType == 'EGLD') && (
              <Form.Item name='prizeDecimals' label='Decimals'>
                {' '}
                <Input type='text' value={prizeDecimals} disabled />
              </Form.Item>
            )}

            {['ESDT', 'SFT', 'EGLD', 'NFT'].includes(prizeType) && (
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
                  type='number'
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  value={prizeAmount}
                  onChange={(e) => {
                    const value: any = (e.target as HTMLInputElement).value;
                    setPrizeAmount(value);
                  }}
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
            {prizeIdentifier && prizeAmount > 0 && (
              <>
                <Form.Item
                  name='tokenPriceType'
                  label='Token Type'
                  tooltip='What type of token will be used to enter the lottery?'
                  rules={[
                    {
                      required: true,
                      message: 'Please select the token type!'
                    }
                  ]}
                >
                  <Radio.Group
                    onChange={handlePriceType}
                    disabled={acceptConditions}
                  >
                    <Radio value='ESDT'>ESDT</Radio>
                    <Radio value='EGLD'>EGLD</Radio>
                    <Radio value='SFT'>SFT</Radio>
                  </Radio.Group>
                </Form.Item>
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
                      disabled={acceptConditions}
                      onChange={(value, datas: any) => {
                        setPriceIdentifier(value);
                        setPriceNonce(
                          datas?.datas?.nonce > 0 ? datas?.datas?.nonce : 0
                        );
                        setPriceDecimals(
                          datas?.datas?.decimals ? datas?.datas?.decimals : 0
                        );
                      }}
                      showSearch
                      placeholder='Select a token or enter manually'
                      optionFilterProp='children'
                      filterOption={(input, option) =>
                        String(option?.children ?? '')
                          .toLowerCase()
                          .indexOf(input.toLowerCase()) >= 0
                      }
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          <Divider style={{ margin: '8px 0' }} />
                          <Input
                            disabled={acceptConditions}
                            value={priceIdentifier}
                            style={{ padding: '8px' }}
                            onChange={
                              (e) => {
                                const value = (e.target as HTMLInputElement)
                                  .value;
                                setPriceIdentifier(value);
                                setPriceNonce(0);
                                setPriceDecimals(0);
                              }
                              //   const value = (e.target as HTMLInputElement).value;
                              //   if (value) {
                              //   }
                            }
                          />
                        </>
                      )}
                    >
                      {''}
                      {price_options.map((token: any) => (
                        <Select.Option
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
                {priceType == 'SFT' && (
                  <Form.Item name='priceNonce' label='Nonce'>
                    {' '}
                    <Input type='text' value={priceNonce} disabled />
                  </Form.Item>
                )}
                {(priceType == 'ESDT' || priceType == 'EGLD') && (
                  <Form.Item name='priceDecimals' label='Decimals'>
                    {' '}
                    <Input type='text' value={priceDecimals} disabled />
                  </Form.Item>
                )}

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
                      type='number'
                      disabled={acceptConditions}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      value={priceAmount}
                      onChange={(e) => {
                        const value: any = (e.target as HTMLInputElement).value;
                        setPriceAmount(value);
                      }}
                    />
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
            {priceIdentifier && priceAmount > 0 && (
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
                    disabled={acceptConditions}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    value={maxTickets}
                    onChange={(e) => {
                      const value: any = (e.target as HTMLInputElement).value;
                      if (value > 100) {
                        setMaxTickets(100);
                      } else if (value < 4) {
                        setMaxTickets(4);
                      } else {
                        setMaxTickets(value);
                      }
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name='maxPerWallet'
                  label='Max Per Wallet'
                  tooltip='Leave 0 for unlimited'
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
                    disabled={acceptConditions}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    value={maxPerWallet}
                    onChange={(e) => {
                      const value: any = (e.target as HTMLInputElement).value;
                      //   console.log('value', value);
                      if (value > maxTickets / 4) {
                        setMaxPerWallet(maxTickets / 4);
                      } else if (value < 0) {
                        setMaxPerWallet(0);
                      } else {
                        setMaxPerWallet(value);
                      }
                    }}
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
                  <DatePicker showTime disabled />
                </Form.Item>
                <Form.Item
                  name='endTime'
                  label='End'
                  tooltip='Leave empty for 3 days end'
                  rules={[
                    { required: false, message: 'Please select the end time!' }
                  ]}
                >
                  <DatePicker showTime disabled />
                </Form.Item>
                <Form.Item
                  name='feePercentage'
                  label='Fee Percentage'
                  tooltip='Fees will be deducted from the creator’s pool to support the development of the platform.'
                  help='Minimum 0.1% and maximum 10%'
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
                      console.log('value', value);
                      if (value > 10) {
                        setFeePercentage(10);
                      } else if (value < 0.1) {
                        setFeePercentage(0.1);
                      } else {
                        setFeePercentage(value);
                      }
                    }}
                  />
                </Form.Item>
              </>
            )}
          </div>
          {priceIdentifier && priceAmount > 0 && (
            <>
              <Form.Item
                name='acceptConditions'
                valuePropName='checked'
                rules={[
                  {
                    validator: (_, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(new Error('Lock form before submit!'))
                  }
                ]}
              >
                <Checkbox
                  onChange={() => setAcceptConditions(!acceptConditions)}
                >
                  Lock configuration and pay 10 GRAOU to start the lottery
                </Checkbox>
              </Form.Item>
              <Form.Item>
                <ActionCreate
                  price_identifier={priceIdentifier}
                  price_nonce={priceNonce}
                  price_decimals={priceDecimals}
                  price_amount={
                    priceDecimals > 0
                      ? new BigNumber(priceAmount)
                          .multipliedBy(10 ** priceDecimals)
                          .toFixed()
                      : new BigNumber(priceAmount).toFixed()
                  }
                  max_tickets={maxTickets}
                  max_per_wallet={maxPerWallet}
                  start_time={startTime}
                  end_time={endTime}
                  fee_percentage={Math.ceil(feePercentage * 100)}
                  prize_identifier={prizeTicker}
                  prize_nonce={prizeNonce}
                  prize_decimals={prizeDecimals}
                  prize_amount={
                    prizeDecimals > 0
                      ? new BigNumber(prizeAmount)
                          .multipliedBy(10 ** prizeDecimals)
                          .toFixed()
                      : new BigNumber(prizeAmount).toFixed()
                  }
                  acceptConditions={acceptConditions}
                  setAcceptConditions={setAcceptConditions}
                  disabled={!acceptConditions}
                />

                {/* <Button
                  type='primary'
                  htmlType='submit'
                  disabled={!acceptConditions}
                  style={{
                    backgroundColor: '#f5ed43',
                    color: 'black',
                    fontFamily: 'Bit Cell',
                    fontSize: '32px',
                    fontWeight: '400',
                    lineHeight: '48px',
                    opacity: acceptConditions ? 1 : 0.5
                  }}
                >
                  Create Lottery
                </Button> */}
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </>
  );
};

export default CreateLotteryModal;
