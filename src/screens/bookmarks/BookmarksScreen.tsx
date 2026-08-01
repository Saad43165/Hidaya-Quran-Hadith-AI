import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BookmarkListItem } from '../../components/bookmarks/BookmarkListItem';
import { listBookmarks, removeBookmark } from '../../services/db/bookmarksRepo';
import { useTranslation } from 'react-i18next';
import { Bookmark } from '../../types/models';
import { colors, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function BookmarksScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const load = useCallback(async () => {
    setBookmarks(await listBookmarks());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleOpen = (bookmark: Bookmark) => {
    if (bookmark.type === 'ayah' && bookmark.surahNumber) {
      navigation.navigate('SurahDetail', {
        surahNumber: bookmark.surahNumber,
        englishName: bookmark.surahName ?? '',
      });
    } else if (bookmark.type === 'hadith' && bookmark.collectionId) {
      navigation.navigate('HadithCollectionDetail', {
        collectionId: bookmark.collectionId,
        name: bookmark.collectionName ?? '',
      });
    }
  };

  const handleRemove = async (id: string) => {
    await removeBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <ScreenContainer noPadding>
      <Text style={styles.heading}>{t('settings.bookmarks')}</Text>
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No bookmarks yet — tap the bookmark icon on any ayah or hadith to save it here.
          </Text>
        }
        renderItem={({ item }) => (
          <BookmarkListItem bookmark={item} onPress={() => handleOpen(item)} onRemove={() => handleRemove(item.id)} />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.displayMd,
    color: colors.navy[900],
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.parchment[600],
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
