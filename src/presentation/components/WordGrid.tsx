import { memo, useCallback, type ReactElement } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';
import { ActivityIndicator, Text, TouchableRipple, useTheme } from 'react-native-paper';

const COLUMNS = 3;
export const WORD_CELL_HEIGHT = 76;

interface WordGridProps {
  words: string[];
  onPressWord: (word: string, index: number) => void;
  onEndReached?: () => void;
  loadingMore?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  ListEmptyComponent?: ReactElement;
  ListFooterExtra?: ReactElement | null;
  testID?: string;
}

/** Grade de 3 colunas com bordas, como no wireframe. */
export function WordGrid({
  words,
  onPressWord,
  onEndReached,
  loadingMore,
  refreshing,
  onRefresh,
  ListEmptyComponent,
  ListFooterExtra,
  testID,
}: WordGridProps) {
  const theme = useTheme();

  const renderItem = useCallback<ListRenderItem<string>>(
    ({ item, index }) => <WordCell word={item} index={index} onPress={onPressWord} />,
    [onPressWord],
  );

  return (
    <FlatList
      testID={testID}
      data={words}
      keyExtractor={(item) => item}
      renderItem={renderItem}
      numColumns={COLUMNS}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      refreshing={refreshing}
      onRefresh={onRefresh}
      initialNumToRender={30}
      maxToRenderPerBatch={30}
      windowSize={11}
      removeClippedSubviews
      getItemLayout={(_, index) => ({
        length: WORD_CELL_HEIGHT,
        offset: WORD_CELL_HEIGHT * index,
        index,
      })}
      contentContainerStyle={[
        styles.content,
        words.length > 0 && {
          borderColor: theme.colors.outline,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderLeftWidth: StyleSheet.hairlineWidth,
        },
        words.length === 0 && styles.emptyContent,
      ]}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={
        <View>
          {loadingMore ? <ActivityIndicator style={styles.footer} /> : null}
          {ListFooterExtra}
        </View>
      }
      keyboardShouldPersistTaps="handled"
    />
  );
}

const WordCell = memo(function WordCell({
  word,
  index,
  onPress,
}: {
  word: string;
  index: number;
  onPress: (word: string, index: number) => void;
}) {
  const theme = useTheme();
  return (
    <TouchableRipple
      onPress={() => onPress(word, index)}
      accessibilityRole="button"
      accessibilityLabel={word}
      testID={`word-${word}`}
      style={[
        styles.cell,
        {
          borderColor: theme.colors.outline,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <Text variant="bodyLarge" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {word}
      </Text>
    </TouchableRipple>
  );
});

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  emptyContent: { justifyContent: 'center' },
  cell: {
    flex: 1 / COLUMNS,
    height: WORD_CELL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  footer: { paddingVertical: 16 },
});
