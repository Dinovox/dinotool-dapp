import { Label } from 'components/Label';
import { ACCOUNTS_ENDPOINT, ExplorerLink } from 'lib';
import { contractAddress } from 'config';

export const ContractAddress = () => {
  return (
    <p>
      <Label>Contract: </Label>
      <ExplorerLink page={`/${ACCOUNTS_ENDPOINT}/${contractAddress}`}>
        {contractAddress}
      </ExplorerLink>
    </p>
  );
};
