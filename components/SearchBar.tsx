import { DesignTokens } from "@/constants/theme";
import { View } from "react-native";
import { TextField } from "./TextField";

type Props = {
  value: string;
  onChange: (text: string) => void;
};

export function SearchBar({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <TextField
        placeholder="Buscar álbuns"
        value={value}
        onChangeText={onChange}
        autoCorrect={false}
        autoCapitalize="none"
        testID="search-bar-input"
      />
    </View>
  );
}

const styles = {
  container: {
    padding: DesignTokens.spacing.sm,
  },
};
