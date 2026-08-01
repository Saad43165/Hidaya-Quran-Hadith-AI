import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { LoadingView, ErrorView } from '../../components/common/AsyncStateView';
import { HadithCollectionItem } from '../../components/hadith/HadithCollectionItem';
import { fetchHadithCollections } from '../../services/api/hadithApi';
import { HadithCollection } from '../../types/models';
import { colors, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HadithScreen() {
  const navigation = useNavigation<Nav>();
  const [collections, setCollections] = useState<HadithCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchHadithCollections();
      setCollections(data);
    } catch (e) {
      setError('Could not load hadith collections. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingView />
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <ErrorView message={error} onRetry={load} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer noPadding>
      <Text style={styles.heading}>Hadith</Text>
      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <HadithCollectionItem
            collection={item}
            onPress={() => navigation.navigate('HadithCollectionDetail', { collectionId: item.id, name: item.name })}
          />
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
});
