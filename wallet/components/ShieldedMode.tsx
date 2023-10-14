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

export const ProfileTabContext = createContext<{
  isShielded: boolean;
  setShielded: Dispatch<SetStateAction<boolean>>;
  isVirtual: boolean;
  setVirtual: Dispatch<SetStateAction<boolean>>;
}>({
  isShielded: false,
  setShielded() {},
  isVirtual: false,
  setVirtual() {}
});

export function useProfileTabApi() {
  return useContext(ProfileTabContext);
}

export function ProfileTabProvider(p: { children: ReactNode }) {
  const [isShielded, setShielded] = useState(false);
  const [isVirtual, setVirtual] = useState(false);
  const value = useMemo(() => ({ isShielded, setShielded, isVirtual, setVirtual }), [isShielded, isVirtual]);
  return (
    <div
      className={classNames("min-h-screen", {
        "bg-black": isShielded,
        "text-white": isShielded,
        "bg-orange-300": isVirtual,
        "text-blue-800": isVirtual
      })}
    >
      <ProfileTabContext.Provider value={value}>
        {p.children}
      </ProfileTabContext.Provider>
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
  const { isShielded, isVirtual } = useProfileTabApi();

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
                "border-blue-800": !isShielded && isVirtual,
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
      <div>Shielded: {isShielded.toString()}</div>
      <div>Virtual: {isVirtual.toString()}</div>
    </div>
  );
}

export function ShieldedTabs(p: { public: ReactNode; private: ReactNode; virtual: ReactNode }) {
  const { isShielded, setShielded, isVirtual, setVirtual } = useProfileTabApi();

  return (
    <TabGroup>
      <Tab
        active={!isShielded && !isVirtual}
        title="Public"
        onClick={() => {setShielded(false); setVirtual(false)}}
      >
        {p.public}
      </Tab>
      <Tab
        active={isShielded && !isVirtual}
        title="Private"
        onClick={() => {setShielded(true); setVirtual(false)}}
      >
        {p.private}
      </Tab>
      <Tab
        active={!isShielded && isVirtual}
        title="Virtual"
        onClick={() => {setShielded(false); setVirtual(true)}}
      >
        {p.virtual}
      </Tab>
    </TabGroup>
  );
}
