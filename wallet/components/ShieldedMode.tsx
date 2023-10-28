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


enum ProfileTab {
  PUBLIC,
  PRIVATE,
  VIRTUAL,
}

export const ProfileTabContext = createContext<{
  currentProfileTab: ProfileTab;
  setCurrentProfileTab: Dispatch<SetStateAction<ProfileTab>>;
}>({
  currentProfileTab: ProfileTab.PUBLIC,
  setCurrentProfileTab() {}
});

export function useProfileTabApi() {
  return useContext(ProfileTabContext);
}

export function ProfileTabProvider(p: { children: ReactNode }) {
  const [currentProfileTab, setCurrentProfileTab] = useState<ProfileTab>(ProfileTab.PUBLIC);
  const value = useMemo(() => ({ currentProfileTab, setCurrentProfileTab }), [currentProfileTab]);
  return (
    <div
      className={classNames("min-h-screen", {
        "bg-black": currentProfileTab === ProfileTab.PRIVATE,
        "text-white": currentProfileTab === ProfileTab.PRIVATE,
        "bg-orange-300": currentProfileTab === ProfileTab.VIRTUAL,
        "text-blue-800": currentProfileTab === ProfileTab.VIRTUAL
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
  const { currentProfileTab } = useProfileTabApi();

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
                "border-white": currentProfileTab === ProfileTab.PRIVATE,
                "border-black": currentProfileTab === ProfileTab.PUBLIC,
                "border-blue-800": currentProfileTab === ProfileTab.VIRTUAL,
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

export function ProfileTabs(p: { public: ReactNode; private: ReactNode; virtual: ReactNode }) {
  const { currentProfileTab, setCurrentProfileTab } = useProfileTabApi();

  return (
    <TabGroup>
      <Tab
        active={currentProfileTab === ProfileTab.PUBLIC}
        title="Public"
        onClick={() => {setCurrentProfileTab(ProfileTab.PUBLIC)}}
      >
        {p.public}
      </Tab>
      <Tab
        active={currentProfileTab === ProfileTab.PRIVATE}
        title="Private"
        onClick={() => {setCurrentProfileTab(ProfileTab.PRIVATE)}}
      >
        {p.private}
      </Tab>
      <Tab
        active={currentProfileTab === ProfileTab.VIRTUAL}
        title="Virtual"
        onClick={() => {setCurrentProfileTab(ProfileTab.VIRTUAL)}}
      >
        {p.virtual}
      </Tab>
    </TabGroup>
  );
}
