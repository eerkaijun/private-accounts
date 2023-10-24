/*Only included when developing Virtual Accounts.
Upon restructuring it is worth reevaluate if all components needed.*/
import React, {
    Dispatch,
    ReactNode,
    SetStateAction,
    createContext,
    useContext,
    useMemo,
    useState,
    useCallback
  } from "react";
import { Horizontal } from "@/ui/Horizontal";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import { AccountBalances } from "./providers/hooks/useBalances";
import { ProfileLayout } from "./Profile";
import { BigNumber } from "ethers";





/*THIS PART INCLUDE Virtual account available. These are examples, and probably
should live in another file??*/

type VirtualAccount = {
    name: string;
    balances: number;
};

const virtualAccountsCreated: VirtualAccount[] = [
  {name: "Account1", balances: 300 },
  {name: "Account2", balances: 500 },
  {name: "Account3", balances: 800 },
];


// Dont think this is needed yet atm?
// Could be required to pass VirtualAccount details to downstream..?

const VirtualAccountContext = createContext<{
  virtualAccount: VirtualAccount | undefined;
  setVirtualAccount: Dispatch<SetStateAction<VirtualAccount | undefined>>;
}>({
  virtualAccount: virtualAccountsCreated[0],
  setVirtualAccount() {},
})

export function useVirtualAccountApi() {
  return useContext(VirtualAccountContext);
}



//Investigate what should be monitor to re-render handleSetAccount.
export function AccountsTable() {
  const { virtualAccount, setVirtualAccount } = useVirtualAccountApi();
 
  const handleSetVirtualAccount = useCallback((virtualAccount: VirtualAccount | undefined) => {
    setVirtualAccount && setVirtualAccount(virtualAccount);
  }, [virtualAccount, setVirtualAccount]);

  return (
    <div className="flex flex-col items-center justify-center">
      <table className="text-left w-full ">
        {virtualAccountsCreated.map((account, index) => (
          <tr key={index} onClick={() => handleSetVirtualAccount(account)}>
            <td className="p-2">{account.name}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="cursor-pointer flex flex-row" onClick={onClick}>
      <div className="flex flex-row align-middle justify-items-center">
        <AiOutlineLeft className="mt-1" />
        <div>Back</div>
      </div>
    </div>
  );
}

export function ChooseAccountLayout({
  asset,
  setAsset,
  balances
}: {
  asset: string | undefined;
  setAsset: (asset? : string) => void;
  balances: Map<string, BigNumber>;
}) {
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | undefined>();
  const value = useMemo(() => ({ virtualAccount, setVirtualAccount }), [virtualAccount]);

  const handleBackClicked = useCallback(() => {
    setVirtualAccount && setVirtualAccount(undefined);  //why setVirtualAccount() would cause issue required 1 arguments, but 0 provided?
  }, [setVirtualAccount]);
  
  return (
    <VirtualAccountContext.Provider value = {value}>
      <div>
        {virtualAccount && <BackButton onClick={handleBackClicked}/>}

        {!virtualAccount && <AccountsTable/>}

        {virtualAccount && (
            <ProfileLayout
              address="0x1234"
              asset={asset}
              balances={balances}
              chainId={31337}
              isPrivate={false}
              pubkey="0x123456789ABCDE"
              setAsset={setAsset}
              title={virtualAccount.name}
            />
          )}
      </div>
    </VirtualAccountContext.Provider>
      
  );
}

/*
<Horizontal>
<div className="text-2xl mb-4">{virtualAccount.name}</div>
</Horizontal>
*/
        //Address, asset, balances, chainId, pubkey, title is based on selected account.
      /*{virtualAccount && (

      )}*/