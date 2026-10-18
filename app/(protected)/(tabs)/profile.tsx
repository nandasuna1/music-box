import { Loading } from "@/components/Loading";
import { Button } from "@/components/Button";
import { DesignTokens } from "@/constants/theme";
import {
  HeaderName,
  HorizontalList,
  ProfilePic,
  ReviewCard,
  Section,
  Stat,
  styles as profileStyles,
} from "@/components/profileComponents";
import { useAuth } from "@/contexts/AuthContext";
import { handleLogout } from "@/services/auth/logout";
import { getUserRecentReviews } from "@/services/reviews/getUserRecentReviews";
import { getUserSaveForLater } from "@/services/saveForLater/getUserSaveForLater";
import { getUserProfile } from "@/services/user/getUserProfile";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Profile() {
  const [avatar, setAvatar] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["user-profile", user?.uid],
    queryFn: () => getUserProfile(user!.uid),
    enabled: !!user?.uid,
  });

  const { data: recentReviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["user-recent-reviews", user?.uid],
    queryFn: () => getUserRecentReviews(user!.uid, 3),
    enabled: !!user?.uid,
  });

  const {
    data: saveForLater,
    isLoading: isLoadingSaveForLater,
    isFetching: isFetchingSaveForLater,
    isError: isSaveForLaterError,
    refetch: refetchSaveForLater,
  } = useQuery({
    queryKey: ["save-for-later", user?.uid],
    queryFn: () => getUserSaveForLater(user!.uid, 3),
    enabled: !!user?.uid,
  });

  async function onLogout() {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await handleLogout();
        },
      },
    ]);
  }

  if (isLoadingProfile || isLoadingReviews) {
    return <Loading />;
  }

  return (
    <>
      <ScrollView
        style={[
          profileStyles.container,
          { paddingTop: insets.top + DesignTokens.spacing.sm },
        ]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-end",
        }}
      >
        {/* HEADER */}
        <View style={profileStyles.header}>
          <ProfilePic avatar={avatar} user={profile} />
          <HeaderName user={profile} />
        </View>

        {/* STATS */}
        <View style={profileStyles.stats}>
          <Stat value={profile?.reviewsCount} label="Reviews" />
          <Stat
            value={profile?.listenLaterCount ? profile?.listenLaterCount : 0}
            label="To listen"
          />
        </View>

        <Section title="Reviews mais recentes">
          {recentReviews?.length === 0 && (
            <Text style={profileStyles.empty}>Nenhuma review ainda</Text>
          )}

          {recentReviews?.map((review) => (
            <ReviewCard key={review.albumId} item={review} />
          ))}
        </Section>

        {/* REVIEWED ALBUMS */}
        <Section title="Ouvir mais tardes">
          {isLoadingSaveForLater ? (
            <Text style={profileStyles.empty}>Carregando...</Text>
          ) : isSaveForLaterError ? (
            <View style={styles.saveForLaterError}>
              <Text style={profileStyles.empty}>
                Não foi possível carregar os álbuns salvos.
              </Text>
              <Button
                variant="secondary"
                loading={isFetchingSaveForLater}
                loadingText="Tentando novamente"
                onPress={async () => {
                  await refetchSaveForLater();
                }}
              >
                Tentar novamente
              </Button>
            </View>
          ) : (
            <HorizontalList items={saveForLater ?? []} />
          )}
        </Section>

        <View style={styles.logout}>
          <Button variant="danger" onPress={onLogout}>
            Logout
          </Button>
        </View>
      </ScrollView>
    </>
  );
}

const styles = {
  saveForLaterError: {
    gap: DesignTokens.spacing.sm,
  },
  logout: {
    marginTop: "auto" as const,
    gap: DesignTokens.spacing.xs,
  },
};
