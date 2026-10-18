import { DesignTokens } from "@/constants/theme";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useState } from "react";

type Props = Omit<TextInputProps, "value" | "onChangeText" | "editable"> & {
  value: string;
  onChangeText: (value: string) => void;
  disabled?: boolean;
  error?: string;
};

export function TextField({
  value,
  onChangeText,
  disabled = false,
  error,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <TextInput
        {...inputProps}
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        placeholderTextColor={DesignTokens.colors.textSubtle}
        selectionColor={DesignTokens.colors.accent}
        style={[
          styles.input,
          focused ? styles.focused : undefined,
          error ? styles.error : undefined,
          disabled
            ? [
                styles.disabled,
                { backgroundColor: DesignTokens.colors.disabledBackground },
              ]
            : undefined,
          style,
        ]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: DesignTokens.sizing.controlMinHeight,
    backgroundColor: DesignTokens.colors.surface,
    borderColor: DesignTokens.colors.border,
    borderWidth: DesignTokens.interaction.defaultBorderWidth,
    borderRadius: DesignTokens.radii.sm,
    color: DesignTokens.colors.text,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    fontSize: DesignTokens.typography.body,
  },
  focused: {
    borderColor: DesignTokens.colors.accent,
    borderWidth: DesignTokens.interaction.focusBorderWidth,
  },
  error: {
    borderColor: DesignTokens.colors.danger,
  },
  disabled: {
    opacity: DesignTokens.interaction.disabledOpacity,
  },
  errorText: {
    color: DesignTokens.colors.danger,
    fontSize: DesignTokens.typography.caption,
    marginTop: DesignTokens.spacing.xs,
  },
});
