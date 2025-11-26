import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL, marketplaceContractAddress } from 'config';
import {
  decodeEvent,
  MARKETPLACE_EVENTS,
  DecodedEvent
} from 'helpers/transactionEventHelper';

export const useMarketplaceEvents = (pollInterval = 6000) => {
  const [events, setEvents] = useState<DecodedEvent[]>([]);
  const lastProcessedTimestamp = useRef<number>(Math.floor(Date.now() / 1000));
  const processedTxHashes = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch recent successful transactions
        const { data: transactions } = await axios.get<any[]>(
          `${API_URL}/accounts/${marketplaceContractAddress}/transactions?size=10&status=success&order=desc`
        );

        const newEvents: DecodedEvent[] = [];

        for (const tx of transactions) {
          // Skip if already processed
          if (processedTxHashes.current.has(tx.txHash)) continue;

          // Skip if older than when we started listening (approx)
          if (tx.timestamp < lastProcessedTimestamp.current) continue;

          processedTxHashes.current.add(tx.txHash);

          // If logs are not present in the list response, we might need to fetch details
          // But usually for recent txs they might be there or we fetch individual tx
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
              for (const def of MARKETPLACE_EVENTS) {
                const decoded = decodeEvent(event, def);
                if (decoded) {
                  // Add a unique ID and timestamp if needed for UI keys
                  const eventWithMeta = {
                    ...decoded,
                    txHash: tx.txHash,
                    timestamp: tx.timestamp,
                    uniqueId: `${tx.txHash}-${event.order || 0}` // fallback unique id
                  };
                  newEvents.push(eventWithMeta);
                }
              }
            }
          }
        }

        if (newEvents.length > 0) {
          // Sort by time just in case
          newEvents.sort((a: any, b: any) => a.timestamp - b.timestamp);

          setEvents((prev) => [...prev, ...newEvents]);

          // Update timestamp to the latest one we found
          const latestTs = Math.max(...newEvents.map((e: any) => e.timestamp));
          lastProcessedTimestamp.current = latestTs;
        }
      } catch (error) {
        console.error('Error polling marketplace events:', error);
      }
    };

    const intervalId = setInterval(fetchEvents, pollInterval);

    // Initial fetch to set the baseline (optional, or just wait for next interval)
    // fetchEvents();

    return () => clearInterval(intervalId);
  }, [pollInterval]);

  // Function to clear events after they are shown
  const clearEvents = () => {
    setEvents([]);
  };

  return { events, clearEvents };
};
