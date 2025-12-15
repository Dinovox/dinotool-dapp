import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL, lotteryContractAddress } from 'config';
import {
  decodeEvent,
  LOTTERY_EVENTS,
  DecodedEvent
} from 'helpers/transactionEventHelper';

export const useLotteryEvents = (pollInterval = 60000) => {
  const [events, setEvents] = useState<DecodedEvent[]>([]);
  const lastProcessedTimestamp = useRef<number>(Math.floor(Date.now() / 1000));
  const processedTxHashes = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch recent successful transactions
        const { data: transactions } = await axios.get<any[]>(
          `${API_URL}/accounts/${lotteryContractAddress}/transactions?size=10&status=success&order=desc`
        );

        const newEvents: DecodedEvent[] = [];

        for (const tx of transactions) {
          // Skip if already processed
          if (processedTxHashes.current.has(tx.txHash)) continue;

          // Skip if older than when we started listening (approx)
          if (tx.timestamp < lastProcessedTimestamp.current) continue;

          processedTxHashes.current.add(tx.txHash);

          let txLogs = tx.logs;

          if (!txLogs || !txLogs.events) {
            try {
              const { data: txDetails } = await axios.get(
                `${API_URL}/transactions/${tx.txHash}`
              );
              txLogs = txDetails.logs;
            } catch (e) {
              console.error('Failed to fetch tx details', e);
              continue;
            }
          }

          if (txLogs && txLogs.events) {
            for (const event of txLogs.events) {
              for (const def of LOTTERY_EVENTS) {
                const decoded = decodeEvent(event, def);
                if (decoded) {
                  const eventWithMeta = {
                    ...decoded,
                    txHash: tx.txHash,
                    timestamp: tx.timestamp,
                    uniqueId: `${tx.txHash}-${event.order || 0}`
                  };
                  newEvents.push(eventWithMeta);
                }
              }
            }
          }
        }

        if (newEvents.length > 0) {
          newEvents.sort((a: any, b: any) => a.timestamp - b.timestamp);
          setEvents((prev) => [...prev, ...newEvents]);
          const latestTs = Math.max(...newEvents.map((e: any) => e.timestamp));
          lastProcessedTimestamp.current = latestTs;
        }
      } catch (error) {
        console.error('Error polling lottery events:', error);
      }
    };

    const intervalId = setInterval(fetchEvents, pollInterval);

    return () => clearInterval(intervalId);
  }, [pollInterval]);

  const clearEvents = () => {
    setEvents([]);
  };

  return { events, clearEvents };
};
