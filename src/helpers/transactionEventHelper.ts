import { Address } from '@multiversx/sdk-core';
import { API_URL } from 'config';

export type EventParamType =
  | 'address'
  | 'u64'
  | 'biguint'
  | 'string'
  | 'u8'
  | 'boolean';

export interface EventFieldDefinition {
  name: string;
  type: EventParamType;
  indexed?: boolean;
}

export interface EventDefinition {
  identifier: string;
  fields: EventFieldDefinition[];
}

export interface DecodedEvent {
  identifier: string;
  [key: string]: any;
}

const decodeValue = (buffer: Buffer, type: EventParamType): any => {
  switch (type) {
    case 'address':
      return new Address(new Uint8Array(buffer)).toBech32();
    case 'u64':
      // Handle empty buffer as 0
      if (buffer.length === 0) return 0;
      return parseInt(buffer.toString('hex'), 16);
    case 'biguint':
      if (buffer.length === 0) return BigInt(0);
      return BigInt('0x' + buffer.toString('hex'));
    case 'string':
      return buffer.toString('utf8');
    case 'u8':
      if (buffer.length === 0) return 0;
      return buffer[0];
    case 'boolean':
      return buffer.length > 0 && buffer[0] === 1;
    default:
      return buffer.toString('hex');
  }
};

export const decodeEvent = (
  event: { identifier: string; topics: string[]; data?: string },
  definition: EventDefinition
): DecodedEvent | null => {
  let topicsOffset = 0;

  if (event.identifier === definition.identifier) {
    topicsOffset = 0;
  } else {
    // Check if first topic is the identifier
    if (event.topics.length > 0) {
      // Try to decode first topic as utf8 string to match identifier
      const firstTopicBuffer = Buffer.from(event.topics[0], 'base64');
      // Some identifiers might be encoded differently, but usually it's utf8
      const firstTopic = firstTopicBuffer.toString('utf8');

      if (firstTopic === definition.identifier) {
        topicsOffset = 1;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  const decoded: DecodedEvent = { identifier: definition.identifier };

  // Filter indexed fields (topics) and non-indexed fields (data)
  const indexedFields = definition.fields.filter((f) => f.indexed !== false);

  indexedFields.forEach((field, index) => {
    const topicIndex = index + topicsOffset;
    if (topicIndex < event.topics.length) {
      const buffer = Buffer.from(event.topics[topicIndex], 'base64');
      decoded[field.name] = decodeValue(buffer, field.type);
    }
  });

  // Non-indexed fields are in `data`.
  // In MultiversX, multiple non-indexed arguments are usually concatenated with `@` separator if they are complex,
  // or just concatenated bytes?
  // The standard implementation often uses `@` to separate arguments in the data field for SC calls,
  // but for Events, it depends.
  // If we look at `emit_auction_token_event`, `creator_royalties_percentage` is the only non-indexed field.
  // So `data` should contain just that.

  const nonIndexedFields = definition.fields.filter((f) => f.indexed === false);
  if (nonIndexedFields.length > 0 && event.data) {
    // If there's only one, it's simple. If multiple, we might need to split by '@' if that's how they are encoded.
    // For now, let's assume simple case or single field.
    // If the data is base64 encoded:
    const dataBuffer = Buffer.from(event.data, 'base64');

    // If we have multiple non-indexed fields, this simple logic won't work without knowing the separator or lengths.
    // But for the requested events, most have 0 or 1 non-indexed field.
    if (nonIndexedFields.length === 1) {
      decoded[nonIndexedFields[0].name] = decodeValue(
        dataBuffer,
        nonIndexedFields[0].type
      );
    } else {
      // TODO: Handle multiple non-indexed fields if necessary (e.g. split by @?)
      // For now, we'll leave it as is or implement basic splitting if needed.
    }
  }

  return decoded;
};

export const waitForTransactionEvent = async (
  txHash: string,
  eventDefinitions: EventDefinition[],
  apiAddress: string = API_URL,
  timeoutMs: number = 60000
): Promise<DecodedEvent[]> => {
  const startTime = Date.now();
  const apiUrl = `${apiAddress}/transactions/${txHash}`;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch transaction');

      const txData = await response.json();

      if (txData.status === 'fail') {
        throw new Error('Transaction failed');
      }

      if (txData.status === 'success') {
        const foundEvents: DecodedEvent[] = [];

        if (txData.logs && txData.logs.events) {
          for (const event of txData.logs.events) {
            for (const def of eventDefinitions) {
              const decoded = decodeEvent(event, def);
              if (decoded) {
                foundEvents.push(decoded);
              }
            }
          }
        }

        // If we found events or if the tx is success but no events matched (maybe we just return empty?)
        // But usually we want to wait until the TX is processed.
        return foundEvents;
      }

      // If pending, wait and retry
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error checking transaction:', error);
      // Depending on error, might want to throw or retry
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Transaction timeout');
};

// Pre-defined definitions for the requested events
export const MARKETPLACE_EVENTS: EventDefinition[] = [
  {
    identifier: 'auction_token_event',
    fields: [
      { name: 'auction_token_id', type: 'string', indexed: true },
      { name: 'auctioned_token_nonce', type: 'u64', indexed: true },
      { name: 'auction_id', type: 'u64', indexed: true },
      { name: 'auctioned_token_amount', type: 'biguint', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'min_bid', type: 'biguint', indexed: true },
      { name: 'max_bid', type: 'biguint', indexed: true },
      { name: 'start_time', type: 'u64', indexed: true },
      { name: 'deadline', type: 'u64', indexed: true },
      { name: 'accepted_payment_token', type: 'string', indexed: true },
      { name: 'accepted_payment_token_nonce', type: 'u64', indexed: true },
      { name: 'auction_type', type: 'u8', indexed: true },
      { name: 'creator_royalties_percentage', type: 'biguint', indexed: false }
    ]
  },
  {
    identifier: 'bid_event',
    fields: [
      { name: 'auction_token_id', type: 'string', indexed: true },
      { name: 'auctioned_token_nonce', type: 'u64', indexed: true },
      { name: 'auction_id', type: 'u64', indexed: true },
      { name: 'nr_auctioned_tokens', type: 'biguint', indexed: true },
      { name: 'bidder', type: 'address', indexed: true },
      { name: 'bid_amount', type: 'biguint', indexed: true }
    ]
  },
  {
    identifier: 'end_auction_event',
    fields: [
      { name: 'auction_token_id', type: 'string', indexed: true },
      { name: 'auctioned_token_nonce', type: 'u64', indexed: true },
      { name: 'auction_id', type: 'u64', indexed: true },
      { name: 'nr_auctioned_tokens', type: 'biguint', indexed: true },
      { name: 'auction_winner', type: 'address', indexed: true },
      { name: 'winning_bid_amount', type: 'biguint', indexed: true }
    ]
  },
  {
    identifier: 'buy_sft_event',
    fields: [
      { name: 'auction_token_id', type: 'string', indexed: true },
      { name: 'auctioned_token_nonce', type: 'u64', indexed: true },
      { name: 'auction_id', type: 'u64', indexed: true },
      { name: 'nr_bought_tokens', type: 'biguint', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'bid_sft_amount', type: 'biguint', indexed: true }
    ]
  },
  {
    identifier: 'withdraw_event',
    fields: [
      { name: 'auction_token_id', type: 'string', indexed: true },
      { name: 'auctioned_token_nonce', type: 'u64', indexed: true },
      { name: 'auction_id', type: 'u64', indexed: true },
      { name: 'nr_auctioned_tokens', type: 'biguint', indexed: true },
      { name: 'seller', type: 'address', indexed: true }
    ]
  },
  {
    identifier: 'offer_token_event',
    fields: [
      { name: 'offer_id', type: 'u64', indexed: true },
      { name: 'offer_token_id', type: 'string', indexed: true },
      { name: 'offer_token_nonce', type: 'u64', indexed: true },
      { name: 'offer_amount', type: 'biguint', indexed: true },
      { name: 'payment_token_type', type: 'string', indexed: true },
      { name: 'payment_token_nonce', type: 'u64', indexed: true },
      { name: 'payment_amount', type: 'biguint', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'start_time', type: 'u64', indexed: true },
      { name: 'deadline', type: 'u64', indexed: true }
    ]
  },
  {
    identifier: 'withdraw_offer_token_event',
    fields: [
      { name: 'offer_id', type: 'u64', indexed: true },
      { name: 'offer_token_id', type: 'string', indexed: true },
      { name: 'offer_token_nonce', type: 'u64', indexed: true },
      { name: 'offer_amount', type: 'biguint', indexed: true },
      { name: 'payment_token_type', type: 'string', indexed: true },
      { name: 'payment_token_nonce', type: 'u64', indexed: true },
      { name: 'payment_amount', type: 'biguint', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'start_time', type: 'u64', indexed: true },
      { name: 'deadline', type: 'u64', indexed: true }
    ]
  },
  {
    identifier: 'accept_offer_token_event',
    fields: [
      { name: 'offer_id', type: 'u64', indexed: true },
      { name: 'offer_token_id', type: 'string', indexed: true },
      { name: 'offer_token_nonce', type: 'u64', indexed: true },
      { name: 'offer_amount', type: 'biguint', indexed: true },
      { name: 'payment_token_type', type: 'string', indexed: true },
      { name: 'payment_token_nonce', type: 'u64', indexed: true },
      { name: 'payment_amount', type: 'biguint', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'start_time', type: 'u64', indexed: true },
      { name: 'deadline', type: 'u64', indexed: true }
    ]
  }
];

export const LOTTERY_EVENTS: EventDefinition[] = [
  {
    identifier: 'lotteryCreated',
    fields: [
      { name: 'creator', type: 'address', indexed: true },
      { name: 'lottery_id', type: 'u64', indexed: true }
    ]
  },
  {
    identifier: 'lotteryDrawn',
    fields: [
      { name: 'lottery_id', type: 'u64', indexed: true },
      { name: 'winner', type: 'address', indexed: true }
    ]
  }
];
