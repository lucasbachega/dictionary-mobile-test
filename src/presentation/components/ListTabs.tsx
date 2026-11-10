import { SegmentedButtons } from 'react-native-paper';

export type HomeTab = 'words' | 'history' | 'favorites';

const TABS = [
  { value: 'words', label: 'Word list', icon: 'format-list-bulleted' },
  { value: 'history', label: 'History', icon: 'history' },
  { value: 'favorites', label: 'Favorites', icon: 'heart-outline' },
] as const;

/** Abas do topo do wireframe: Word list | History | Favorites. */
export function ListTabs({ value, onChange }: { value: HomeTab; onChange: (tab: HomeTab) => void }) {
  return (
    <SegmentedButtons
      value={value}
      onValueChange={(v) => onChange(v as HomeTab)}
      density="small"
      buttons={TABS.map((tab) => ({
        value: tab.value,
        label: tab.label,
        icon: value === tab.value ? undefined : tab.icon,
        showSelectedCheck: false,
        accessibilityLabel: tab.label,
        testID: `tab-${tab.value}`,
        labelStyle: { fontSize: 13 },
      }))}
    />
  );
}
