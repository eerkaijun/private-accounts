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
  } from "react";

/*THIS PART INCLUDE Virtual account available. These are examples, and probably
should live in another file??*/

type VirtualAccount = {
    name: string;
    balances: number;
};

const virtualAccounts: VirtualAccount[] = [
  {name: "Account1", balances: 300 },
  {name: "Account2", balances: 500 },
  {name: "Account3", balances: 800 },
];

export const VirtualAccountContext = createContext<{
  currentVirtualAccount: VirtualAccount;
  setCurrentVirtualAccount: Dispatch<SetStateAction<VirtualAccount>>;
}>({
  currentVirtualAccount: virtualAccounts[0],
  setCurrentVirtualAccount() {},
})

export function useVirtualAccountApi() {
  return useContext(VirtualAccountContext);
}

export function AccountsTable() {
  return (
    <div className="flex flex-col items-center justify-center">
      <table className="text-left w-full ">
        {virtualAccounts.map((account, index) => (
          <tr key={index}>
            <td className="p-2">{account.name}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}


export function ChooseAccountLayout() {
  return (

    //Improve this by creating accountSelected and checking how to use BackButton.
    {accountSelected && <BackButton onClick={handleBackClicked} />}

    //Also required accountSelected to work
    {!accountSelected && <AccountsTable/>}

    //Address, asset, balances, chainId, pubkey, title is based on selected account.
    {accountSelected && (
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
    )}

  );
}
