import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  value?: number;
  onChange?: (rate: number) => void;
  size?: number;
};

export function RatingInput({
  value = 0,
  onChange = () => {},
  size = 28,
}: Props) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)}>
          <Text
            style={
              star <= value
                ? [styles.filled, { fontSize: size }]
                : [styles.empty, { fontSize: size }]
            }
          >
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 0,
  },
  filled: {
    color: "#FFD700",
  },
  empty: {
    color: "#DDD",
  },
});
