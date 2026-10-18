import { DesignTokens } from "@/constants/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  value?: number;
  onChange?: (rate: number) => void;
  size?: number;
  disabled?: boolean;
};

export function RatingInput({
  value = 0,
  onChange = () => {},
  size = DesignTokens.sizing.ratingStar,
  disabled = false,
}: Props) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange(star)}
          disabled={disabled}
          style={disabled ? styles.disabled : undefined}
        >
          <Text
            style={
              star <= value
                ? [styles.filled, { fontSize: size }]
                : [
                    styles.empty,
                    {
                      fontSize: size,
                    },
                  ]
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
  },
  filled: {
    color: DesignTokens.colors.accent,
  },
  empty: {
    color: DesignTokens.colors.textMuted,
  },
  disabled: {
    opacity: DesignTokens.interaction.disabledOpacity,
  },
});
