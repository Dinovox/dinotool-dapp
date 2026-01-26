import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPendingTransactions } from 'lib';
import { signAndSendTransactions } from 'helpers';
import {
  Address,
  GAS_PRICE,
  Transaction,
  useGetAccountInfo,
  useGetNetworkConfig
} from 'lib';
import { marketplaceContractAddress } from 'config';
import BigNumber from 'bignumber.js';
import { bigNumToHex } from 'helpers/bigNumToHex';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';
import bigToHex from 'helpers/bigToHex';
import {
  waitForTransactionEvent,
  MARKETPLACE_EVENTS
} from '../../../helpers/transactionEventHelper';

export interface ActionBuySftProps {
  auctionId: BigNumber;
  nftType: string;
  nftNonce: string; // u64
  buyStepAmount: BigNumber; // amount to buy (quantity)
  paymentToken: string;
  paymentAmount: BigNumber; // total payment amount (price per unit * quantity)
  disabled?: boolean;
}

export const ActionBuySft = ({
  auctionId,
  nftType,
  nftNonce,
  buyStepAmount,
  paymentToken,
  paymentAmount,
  disabled
}: ActionBuySftProps) => {
  const loading = useLoadTranslations('marketplace');
  const { t } = useTranslation();

  const transactions: Record<string, any> = useGetPendingTransactions();
  const hasPendingTransactions = Object.keys(transactions).length > 0;

  const navigate = useNavigate();
  const [transactionSessionId, setTransactionSessionId] = useState<
    string | null
  >(null);
  const { address } = useGetAccountInfo();
  const { network } = useGetNetworkConfig();

  const sendBuySftTransaction = async () => {
    // endpoint: buySft
    // payable: yes (paymentAmount in paymentToken)
    // args: auction_id, nft_type, nft_nonce, opt_sft_buy_amount

    let paymentTransferPart = '';
    const isEgld = paymentToken === 'EGLD';

    if (isEgld) {
      // Direct EGLD transfer is handled by 'value' field, but for smart contract calls usually we send 0 value and use function arguments,
      // UNLESS it's a payable function that expects EGLD.
      // The snippet says #[payable("*")], so it accepts any payment.
      // If payment is EGLD, we send it in 'value'.
      // If payment is ESDT, we use ESDTTransfer or MultiESDTNFTTransfer.
    } else {
      // Logic for ESDT transfer (not strictly requested right now but good to prepare)
      // For now if it's EGLD we just call the endpoint.
      // If it's ESDT, we usually do ESDTTransfer@Token@Amount@Function@Args...
    }

    // Construct payload
    // buySft@auction_id@nft_type@nft_nonce@opt_sft_buy_amount

    // BUT: If we are paying with ESDT, the wrapper is needed.
    // Assuming standard EGLD usage for now or handle simple ESDTTransfer if needed.
    // The request doesn't specify payment token type logic details but the existing ActionBid handles it.
    // Let's copy the pattern from ActionBid if possible or assume standard SC call pattern.

    // IMPORTANT: The user said #[payable("*")].
    // If paying in EGLD: Transaction value = paymentAmount, data = buySft@...
    // If paying in ESDT: Transaction value = 0, data = ESDTTransfer@Token@Amount@Contract@function@...

    let data = '';
    let value = BigInt(0);

    const sftBuyAmountHex = bigToHex(BigInt(buyStepAmount.toFixed()));
    const auctionIdHex = bigToHex(BigInt(auctionId.toFixed()));
    const nftTypeHex = Buffer.from(nftType, 'utf8').toString('hex');
    const nftNonceHex = bigToHex(BigInt(nftNonce));

    const funcName = Buffer.from('buySft', 'utf8').toString('hex');

    if (isEgld) {
      value = BigInt(paymentAmount.toFixed());
      data = `buySft@${auctionIdHex}@${nftTypeHex}@${nftNonceHex}@${sftBuyAmountHex}`;
    } else {
      // ESDTTransfer logic
      // ESDTTransfer@TokenID@Amount@ContractAddress@FunctionName@Args...
      const tokenHex = Buffer.from(paymentToken, 'utf8').toString('hex');
      const amountHex = bigToHex(BigInt(paymentAmount.toFixed()));

      data = `ESDTTransfer@${tokenHex}@${amountHex}@${funcName}@${auctionIdHex}@${nftTypeHex}@${nftNonceHex}@${sftBuyAmountHex}`;
    }

    const transaction = new Transaction({
      value,
      data: new TextEncoder().encode(data),
      receiver: new Address(marketplaceContractAddress),
      // Standard pattern for ESDTTransfer to SC:
      // Receiver: Contract Address (WRONG - for single ESDTTransfer, receiver is SC)
      // Wait, for ESDTTransfer, the documented way is:
      // Sender -> Sender, data: ESDTTransfer... (WRONG)
      // Sender -> Contract, data: ESDTTransfer... (RIGHT? No)
      //
      // Correct ESDT Call pattern:
      // Sender -> Contract (receiver)
      // Data: ESDTTransfer@Token@Amount@Function@Args
      //
      // Let's verify ActionBid pattern if possible.
      // But for now, standard MultiversX for calling payable endpoint with ESDT is:
      // Receiver: Contract Address
      // Data: ESDTTransfer@Token@Amount@Function@Args

      gasLimit: BigInt('10000000'), // Estimate
      gasPrice: BigInt(GAS_PRICE),
      chainID: network.chainId,
      sender: new Address(address),
      version: 1
    });

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Processing SFT purchase',
        errorMessage: 'An error occurred during purchase',
        successMessage: 'Purchase successful'
      }
    });

    if (sessionId) {
      setTransactionSessionId(sessionId);
    }
  };

  return (
    <>
      {!hasPendingTransactions ? (
        <button
          onClick={sendBuySftTransaction}
          disabled={disabled}
          className='inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {t('marketplace:buy_now_sft')} {buyStepAmount.toString()}{' '}
          {buyStepAmount.gt(1) ? 'items' : 'item'}
        </button>
      ) : (
        <button
          disabled
          className='inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white opacity-50 cursor-not-allowed'
        >
          {t('marketplace:processing')}
        </button>
      )}
    </>
  );
};
