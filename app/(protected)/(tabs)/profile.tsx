import { Loading } from "@/components/Loading";
import {
  HeaderName,
  HorizontalList,
  ProfilePic,
  ReviewCard,
  Section,
  Stat,
  styles,
} from "@/components/profileComponents";
import { useAuth } from "@/contexts/AuthContext";
import { handleLogout } from "@/services/auth/logout";
import { getUserRecentReviews } from "@/services/reviews/getUserRecentReviews";
import { getUserSaveForLater } from "@/services/saveForLater/getUserSaveForLater";
import { getUserProfile } from "@/services/user/getUserProfile";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
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
        style={[styles.container, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-end",
        }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <ProfilePic avatar={avatar} user={profile} />
          <HeaderName user={profile} />
        </View>

        {/* STATS */}
        <View style={styles.stats}>
          <Stat value={profile?.reviewsCount} label="Reviews" />
          <Stat
            value={profile?.listenLaterCount ? profile?.listenLaterCount : 0}
            label="To listen"
          />
        </View>

        <Section title="Reviews mais recentes">
          {recentReviews?.length === 0 && (
            <Text style={styles.empty}>Nenhuma review ainda</Text>
          )}

          {recentReviews?.map((review) => (
            <ReviewCard key={review.albumId} item={review} />
          ))}
        </Section>

        {/* REVIEWED ALBUMS */}
        <Section title="Ouvir mais tardes">
          {isLoadingSaveForLater ? (
            <Text style={styles.empty}>Carregando...</Text>
          ) : isSaveForLaterError ? (
            <Text style={styles.empty}>
              Não foi possível carregar os álbuns salvos.
            </Text>
          ) : (
            <HorizontalList items={saveForLater ?? []} />
          )}
        </Section>

        <View
          style={{
            marginBottom: 0,
            marginTop: "auto",
            gap: 4,
          }}
        >
          <Pressable
            onPress={onLogout}
            style={{
              padding: 16,
              backgroundColor: "#ff4d4f",
              borderRadius: 8,
              alignItems: "center",
              marginBottom: 0,
              marginTop: "auto",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}
