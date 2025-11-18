import * as React from 'react';
import BigNumber from 'bignumber.js';
import { useState } from 'react';
import { useGetPendingTransactions } from 'lib';
import { signAndSendTransactions } from 'helpers';
import {
  Address,
  GAS_PRICE,
  Transaction,
  useGetNetworkConfig,
  useGetAccountInfo
} from 'lib';
import { bigNumToHex } from 'helpers/bigNumToHex';

// type RewardToSend = {
//   collection: string; // ex: "DYNASFT-d4f18f"
//   nonce: string | number | bigint; // ex: 2
//   required: string | number; // quantité totale à posséder
//   available?: string | number; // quantité déjà en wallet (optionnel)
//   token?: {
//     available?: string | number;
//     required?: string | number;
//     missing?: string | number;
//   };
// };

type RewardToSend = {
  collection: string;
  nonce: string | number | bigint;
  identifier: string; // ⬅️ NEW
  required: string | number; // (optionnel si tu n’en as plus l’usage direct)
  available?: string | number;
  token?: {
    available?: string | number;
    required?: string | number;
    missing?: string | number; // utilisé pour le toSend
  };
};
type Props = {
  egld_amount: string | number | BigNumber; // en WEI (unités brutes)
  rewards: RewardToSend[];
  receiver_address: string; // bech32
};

const textToHex = (s: string) => Buffer.from(s, 'utf8').toString('hex');

/** construit le payload MultiESDTNFTTransfer + assetCount */
function buildMultiEsdtPayload(
  receiverBech32: string,
  egldAmountWei: string | number | BigNumber,
  rewards: RewardToSend[]
): { payload: string; assetCount: number } {
  const receiverHex = new Address(receiverBech32).toHex();

  // entries = [ (idHex, nonceHex, amountHex) ... ]
  const entries: Array<{ idHex: string; nonceHex: string; amountHex: string }> =
    [];

  // 1) EGLD si > 0
  const egld = new BigNumber(egldAmountWei || 0);
  if (egld.gt(0)) {
    entries.push({
      idHex: textToHex('EGLD-000000'),
      nonceHex: bigNumToHex(new BigNumber(0)),
      amountHex: bigNumToHex(egld)
    });
  }

  // 2) SFT/NFT manquants
  for (const rw of rewards || []) {
    // const required = new BigNumber(rw.token?.required || 0);
    // const available = new BigNumber(rw.token?.available || 0);
    const toSend = new BigNumber(rw.token?.missing || 0);
    if (toSend.gt(0)) {
      entries.push({
        idHex: textToHex(rw.collection),
        nonceHex: bigNumToHex(new BigNumber(String(rw.nonce ?? 0))),
        amountHex: bigNumToHex(toSend)
      });
    }
  }

  if (entries.length === 0) {
    throw new Error('Nothing to transfer (no EGLD and no token shortfall).');
  }

  const parts: string[] = [
    'MultiESDTNFTTransfer',
    receiverHex,
    bigNumToHex(new BigNumber(entries.length)) // compteur d’assets
  ];

  for (const e of entries) {
    parts.push(e.idHex, e.nonceHex, e.amountHex);
  }

  return { payload: parts.join('@'), assetCount: entries.length };
}

/** estimation conservatrice du gas */
function estimateGasForMultiEsdt(payload: string, assetCount: number) {
  const base = 50_000;
  const perAsset = 200_000;
  const perByte = 1_500;
  const sizeBytes = payload.length; // payload ASCII
  const gas = base + assetCount * perAsset + sizeBytes * perByte;
  return Math.round(gas * 1.1); // marge 10%
}

export const ActionTransfert: React.FC<Props> = ({
  egld_amount,
  rewards,
  receiver_address
}) => {
  // console.log('ActionTransfert render', {
  //   egld_amount,
  //   rewards,
  //   receiver_address
  // });
  const { address } = useGetAccountInfo();
  const { network } = useGetNetworkConfig();
  const pending = useGetPendingTransactions();
  const hasPendingTransactions = pending.length > 0;
  const [, setTransactionSessionId] = useState<string | null>(null);

  // totaux pour l’affichage
  const egldDisplay = new BigNumber(egld_amount || 0)
    .dividedBy(1e18)
    .toNumber();

  const assetsPlanned = React.useMemo(() => {
    let count = 0;
    for (const rw of rewards || []) {
      const toSend = BigNumber.max(
        new BigNumber(rw.token?.required || 0).minus(rw.token?.available || 0),
        0
      );
      if (toSend.gt(0)) count += 1;
    }
    return count;
  }, [egld_amount, rewards]);

  const canSend =
    (assetsPlanned > 0 || egldDisplay > 0) && !hasPendingTransactions;

  const sendFundTransaction = async () => {
    try {
      let value = BigInt(0);
      let { payload, assetCount } = buildMultiEsdtPayload(
        receiver_address,
        egld_amount,
        rewards
      );
      let gasLimit = BigInt(estimateGasForMultiEsdt(payload, assetCount));

      if (!assetsPlanned || assetsPlanned === 0) {
        payload = '';
        value = egld_amount ? BigInt(egld_amount.toString()) : BigInt(0);
        assetCount = 0;
        gasLimit = 100_000n; // simple transfert EGLD
      }
      const tx = new Transaction({
        value: BigInt(value), // valeur envoyée “au champ value” (reste 0 en MultiESDT)
        data: new TextEncoder().encode(payload), // payload
        receiver: payload
          ? new Address(address)
          : new Address(receiver_address), // same as sender if not simple EGLD transfer
        gasLimit,
        gasPrice: BigInt(GAS_PRICE),
        chainID: network.chainId,
        sender: new Address(address),
        version: 1
      });
      console.log('Sending transfer tx:', {
        tx,
        payload,
        assetCount,
        gasLimit
      });

      const sessionId = await signAndSendTransactions({
        transactions: [tx],
        transactionsDisplayInfo: {
          processingMessage: 'Processing transfer…',
          errorMessage: 'Transfer failed',
          successMessage: 'Transfer submitted'
        }
      });
      if (sessionId) setTransactionSessionId(sessionId);
    } catch (e: any) {
      console.error('Unable to build/send transfer:', e?.message || e);
    }
  };

  return (
    <>
      {canSend && (
        <>
          {' '}
          <button
            className='dinoButton'
            onClick={sendFundTransaction}
            disabled={!canSend}
          >
            Transfer missing assets to hosted wallet
            <br />
            {assetsPlanned} asset{assetsPlanned > 1 ? 's' : ''}{' '}
            {egldDisplay > 0 && (
              <>
                +{' '}
                {egldDisplay.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6
                })}{' '}
                EGLD
              </>
            )}
          </button>
        </>
      )}

      {!canSend && (
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
          {hasPendingTransactions
            ? 'A transaction is already pending…'
            : 'Nothing to transfer.'}
        </div>
      )}
    </>
  );
};
