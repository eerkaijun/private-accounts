import { Horizontal } from "@/ui/Horizontal";
import classNames from "classnames";
// import { Tabs } from "flowbite-react";
import React, {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import { HiAdjustments, HiClipboardList, HiUserCircle } from "react-icons/hi";
import { MdDashboard } from "react-icons/md";

export const ShieldedContext = createContext<{
  isShielded: boolean;
  setShielded: Dispatch<SetStateAction<boolean>>;
}>({
  isShielded: false,
  setShielded() {},
});

export const VirtualContext = createContext<{
  isVirtual: boolean;
  setVirtual: Dispatch<SetStateAction<boolean>>;
}>({
  isVirtual: false,
  setVirtual() {},
});

export function useShieldedApi() {
  return useContext(ShieldedContext);
}

export function useVirtualApi() {
  return useContext(VirtualContext);
}

export function ShieldedProvider(p: { children: ReactNode }) {
  const [isShielded, setShielded] = useState(false);
  /*COMBINE ISVIRTUAL HERE */
  const value = useMemo(() => ({ isShielded, setShielded }), [isShielded]);
  return (
    <div
      className={classNames("min-h-screen", {
        "bg-black": isShielded,
        "text-white": isShielded,
      })}
    >
      <ShieldedContext.Provider value={value}>
        {p.children}
      </ShieldedContext.Provider>
    </div>
  );
}

export function VirtualProvider(p: { children: ReactNode }) {
  const [isVirtual, setVirtual] = useState(false);
  const value = useMemo(() => ({ isVirtual, setVirtual }), [isVirtual]);
  return (
    <div
      className={classNames("min-h-screen", {
        "bg-orange-500": isVirtual,
        "text-white": isVirtual,
      })}
    >
      <VirtualContext.Provider value={value}>
        {p.children}
      </VirtualContext.Provider>
    </div>
  );
}


type TabProps = {
  active: boolean;
  title: string;
  children: ReactNode;
  onClick: () => void;
};
function Tab(p: TabProps) {
  if (!p.active) return null;
  return null;
}

function TabGroup(p: { children: ReactNode }) {
  const { isShielded } = useShieldedApi();
  const { isVirtual } = useVirtualApi();

  const tabs =
    React.Children.map(p.children, (child) => {
      const props = (child as any).props as TabProps;
      return props;
    }) ?? [];

  const content = React.Children.map(p.children, (child) => {
    const props = (child as any).props as TabProps;
    return props.active ? props.children : null;
  });
  return (
    <div className="w-full">
      <div className="flex flex-row justify-center mb-8">
        <Horizontal>
          {tabs.map(({ title, onClick, active }) => (
            <div
              className={classNames("w-full p-6 cursor-pointer", {
                "border-b": !active,
                "border-b-10": !active,
                "border-white": isShielded && !isVirtual,
                "border-black": !isShielded && !isVirtual,
                "border-blue-500": !isShielded && isVirtual,
                "border-t": active,
                "border-t-10": active,
                "border-x": active,
                "border-x-10": active,
              })}
              onClick={onClick}
              key={title}
            >
              {title}
            </div>
          ))}
        </Horizontal>
      </div>
      <div>{content}</div>
    </div>
  );
}

export function ShieldedTabs(p: { public: ReactNode; private: ReactNode; virtual: ReactNode }) {
  const { isShielded, setShielded } = useShieldedApi();
  const { isVirtual, setVirtual } = useVirtualApi();

  return (
    <TabGroup>
      <Tab
        active={!isShielded && !isVirtual}
        title="Public"
        onClick={() => {setShielded(false); setVirtual(false); console.log("Shielded: ", isShielded); console.log("Virtual: ", isVirtual)}}
      >
        {p.public}
      </Tab>
      <Tab
        active={isShielded && !isVirtual}
        title="Private"
        onClick={() => {setShielded(true); setVirtual(false); console.log("Shielded: ", isShielded); console.log("Virtual: ", isVirtual)}}
      >
        {p.private}
      </Tab>
      <Tab
        active={!isShielded && isVirtual}
        title="Virtual"
        onClick={() => { console.log("Shielded: ", isShielded); setShielded(false); setVirtual(true); console.log("Virtual: ", isVirtual)}}
      >
        {p.virtual}
      </Tab>
    </TabGroup>
  );
}
