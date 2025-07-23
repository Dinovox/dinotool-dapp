import { n } from 'framer-motion/dist/types.d-B_QPEvFK';

export interface NFT {
  identifier: string;
  name: string;
  collection: string;
  nonce: number;
  type: string;
  creator: string;
  royalties: number;
  uris: string[];
  url: string;
  media?: {
    url: string;
    originalUrl: string;
    thumbnailUrl: string;
    fileType: string;
    fileSize: number;
  }[];
  isWhitelistedStorage: boolean;
  metadata?: {
    description?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
  balance: string;
  ownedByCurrentUser?: boolean;
}

export interface LockedNFT extends NFT {
  lockId?: number;
  lockDate: Date;
  unlockTimestamp: Date;
  vestingDuration: number; // en jours
  isLocked: boolean;
  lockTransactionHash?: string;
}

export interface Partner {
  address: string;
  name: string;
  email?: string;
  isVerified: boolean;
  joinDate: Date;
  totalLockedNFTs: number;
}

export interface LockingTransaction {
  nftIdentifier: string;
  duration: number;
  unlockDate: Date;
  status: 'pending' | 'confirmed' | 'failed';
  transactionHash?: string;
}
