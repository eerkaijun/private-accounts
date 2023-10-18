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

export const VirtualAccountContext = createContext<{
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

export function VirtualAccountContextProvider(p: { children: ReactNode }) {
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | undefined>();
  const value = useMemo(() => ({ virtualAccount, setVirtualAccount }), [virtualAccount]);
  <VirtualAccountContext.Provider value ={value}>
    {p.children}
  </VirtualAccountContext.Provider>
}

export function ChooseAccountLayout() {
  const { virtualAccount, setVirtualAccount } = useVirtualAccountApi();

  const handleBackClicked = useCallback(() => {
    setVirtualAccount && setVirtualAccount(undefined);  //why setVirtualAccount() would cause issue required 1 arguments, but 0 provided?
  }, [setVirtualAccount]);
  
  return (
      <div>
        {virtualAccount && <BackButton onClick={handleBackClicked}/>}

        {!virtualAccount && <AccountsTable/>}

        {virtualAccount && (
          <Horizontal>
            <div className="text-2xl mb-4">{virtualAccount.name}</div>
          </Horizontal>
          )}
      </div>
        //Address, asset, balances, chainId, pubkey, title is based on selected account.
      /*{virtualAccount && (
        <ProfileLayout
          address={address}
          asset={asset}
          balances={balances.publicBalances}
          chainId={chainId}
          isPrivate={false}
          pubkey={pubkey}
          setAsset={setAsset}
          title={"Public Account"}
        />
      )}*/
  );
}


export function VirtualProfileLayout() {  
  return (
    <VirtualAccountContextProvider p=<ChooseAccountLayout/> />

  );
}
