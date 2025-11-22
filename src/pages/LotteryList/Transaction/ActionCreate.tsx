import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPendingTransactions } from 'lib';
import { signAndSendTransactions } from 'helpers';
import {
  AbiRegistry,
  Address,
  GAS_PRICE,
  SmartContractTransactionsFactory,
  Transaction,
  TransactionsFactoryConfig,
  useGetAccount,
  useGetNetworkConfig,
  useGetAccountInfo
} from 'lib';
import {
  lottery_cost,
  lotteryContractAddress,
  xgraou_identifier
} from 'config';
import BigNumber from 'bignumber.js';
import { bigNumToHex } from 'helpers/bigNumToHex';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';
import {
  waitForTransactionEvent,
  LOTTERY_EVENTS
} from 'helpers/transactionEventHelper';

enum PriceType {
  Egld,
  Esdt,
  Sft,
  Nft,
  LockedEgld,
  LockedEsdt,
  LockedSft,
  LockedNft
}

function getPriceTypeEnum(priceType: string): PriceType | undefined {
  const priceTypeMap: Record<string, PriceType> = {
    Egld: PriceType.Egld,
    Esdt: PriceType.Esdt,
    Sft: PriceType.Sft,
    Nft: PriceType.Nft,
    LockedEgld: PriceType.LockedEgld,
    LockedEsdt: PriceType.LockedEsdt,
    LockedSft: PriceType.LockedSft,
    LockedNft: PriceType.LockedNft
  };

  return priceTypeMap[priceType] ?? undefined;
}

export const ActionCreate = ({
  prize_type,
  prize_identifier,
  prize_nonce,
  prize_amount,
  price_identifier,
  price_nonce,
  price_amount,
  max_tickets,
  max_per_wallet,
  start_time,
  end_time,
  price_type,
  is_free,
  is_locked,
  auto_draw,
  fee_percentage,
  pay_with,
  disabled
}: any) => {
  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();

  const transactions: Record<string, any> = useGetPendingTransactions();
  const hasPendingTransactions = Object.keys(transactions).length > 0;

  const navigate = useNavigate();
  const [transactionSessionId, setTransactionSessionId] = useState<
    string | null
  >(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { address } = useGetAccountInfo();
  const { network } = useGetNetworkConfig();

  // 🎯 Vérifier si on a un txHash après l'envoi de la transaction
  useEffect(() => {
    if (transactionSessionId && hasPendingTransactions && !txHash) {
      let foundHash = null;

      if (Array.isArray(transactions) && transactions.length > 0) {
        foundHash = transactions[0].hash;
      } else if (transactions[transactionSessionId]) {
        foundHash = transactions[transactionSessionId].transactions?.[0]?.hash;
      }

      if (foundHash) {
        setTxHash(foundHash);
        checkTransactionStatus(foundHash);
      }
    }
  }, [transactionSessionId, hasPendingTransactions, transactions, txHash]);

  const sendFundTransaction = async () => {
    const graou_identifier =
      pay_with == 'EGLD' ? 'EGLD-000000' : xgraou_identifier;
    const graou_amount =
      pay_with == 'EGLD'
        ? new BigNumber(lottery_cost.egld)
        : new BigNumber(lottery_cost.graou);
    let data = '';
    if (auto_draw) {
      //auto draw demande des EGLD en plus en fonction du nombre de tickets
      data =
        'MultiESDTNFTTransfer@' +
        new Address(lotteryContractAddress).toHex() +
        '@03@' +
        Buffer.from(graou_identifier, 'utf8').toString('hex') +
        '@' +
        bigNumToHex(new BigNumber(0)) +
        '@' +
        bigNumToHex(graou_amount) +
        '@' +
        Buffer.from(prize_identifier, 'utf8').toString('hex') +
        '@' +
        bigNumToHex(
          new BigNumber(prize_nonce).isGreaterThan(0)
            ? new BigNumber(prize_nonce)
            : new BigNumber(0)
        ) +
        '@' +
        bigNumToHex(new BigNumber(prize_amount)) +
        '@' +
        Buffer.from('EGLD-000000', 'utf8').toString('hex') +
        '@' +
        bigNumToHex(new BigNumber(0)) +
        '@' +
        bigNumToHex(new BigNumber(200000000000000).multipliedBy(max_tickets)) +
        '@' +
        Buffer.from('create', 'utf8').toString('hex');
    } else {
      data =
        'MultiESDTNFTTransfer@' +
        new Address(lotteryContractAddress).toHex() +
        '@02@' +
        Buffer.from(graou_identifier, 'utf8').toString('hex') +
        '@' +
        bigNumToHex(new BigNumber(0)) +
        '@' +
        bigNumToHex(graou_amount) +
        '@' +
        Buffer.from(prize_identifier, 'utf8').toString('hex') +
        '@' +
        bigNumToHex(
          new BigNumber(prize_nonce).isGreaterThan(0)
            ? new BigNumber(prize_nonce)
            : new BigNumber(0)
        ) +
        '@' +
        bigNumToHex(new BigNumber(prize_amount)) +
        '@' +
        Buffer.from('create', 'utf8').toString('hex');
    }

    const sub =
      '@' +
      bigNumToHex(
        new BigNumber(getPriceTypeEnum(prize_type) ?? PriceType.Egld)
      ) +
      '@' +
      Buffer.from(price_identifier, 'utf8').toString('hex') +
      '@' +
      bigNumToHex(new BigNumber(price_nonce)) +
      '@' +
      bigNumToHex(new BigNumber(price_amount)) +
      '@' +
      bigNumToHex(new BigNumber(max_tickets)) +
      '@' +
      bigNumToHex(new BigNumber(max_per_wallet)) +
      '@' +
      bigNumToHex(new BigNumber(start_time)) +
      '@' +
      bigNumToHex(new BigNumber(end_time)) +
      '@' +
      bigNumToHex(
        new BigNumber(
          getPriceTypeEnum(
            is_free
              ? 'Free' + price_type
              : is_locked
              ? 'Locked' + price_type
              : price_type
          ) ?? PriceType.Egld
        )
      ) +
      '@' +
      bigNumToHex(new BigNumber(auto_draw ? 1 : 0));

    const payload = data + sub;

    const transaction = new Transaction({
      value: BigInt('0'),
      data: new TextEncoder().encode(payload),
      receiver: new Address(address),
      gasLimit: BigInt(14000000),

      gasPrice: BigInt(GAS_PRICE),
      chainID: network.chainId,
      sender: new Address(address),
      version: 1
    });

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Processing create transaction',
        errorMessage: 'An error occurred during creation',
        successMessage: 'Create transaction successful'
      }
    });

    if (sessionId) {
      setTransactionSessionId(sessionId);
    }
  };

  const checkTransactionStatus = async (hash: string) => {
    try {
      console.log('🔍 Checking transaction status for:', hash);
      const events = await waitForTransactionEvent(hash, LOTTERY_EVENTS);

      console.log('✅ Transaction events found:', events);

      const lotteryEvent = events.find(
        (e) => e.identifier === 'lotteryCreated'
      );

      if (lotteryEvent) {
        const lotteryId = lotteryEvent.lottery_id;
        console.log('🎉 Lottery created with ID:', lotteryId);
        navigate(`/lotteries/${lotteryId}`);
      } else {
        console.warn('⚠️ No lotteryCreated event found in transaction logs');
      }
    } catch (error) {
      console.error('❌ Error checking transaction status:', error);
    }
  };

  return (
    <>
      {!hasPendingTransactions ? (
        <button
          className='dinoButton'
          onClick={sendFundTransaction}
          disabled={disabled}
        >
          {t('lotteries:create_lottery')}
        </button>
      ) : (
        <button className='dinoButton' disabled>
          {t('lotteries:processing')}
        </button>
      )}
    </>
  );
};
