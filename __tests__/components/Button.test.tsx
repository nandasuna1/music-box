import { Button } from "@/components/Button";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

describe("Button", () => {
  it("renders its content and invokes the action", () => {
    const onPress = jest.fn();

    render(<Button onPress={onPress}>Save album</Button>);

    fireEvent.press(screen.getByText("Save album"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not invoke its action when disabled", () => {
    const onPress = jest.fn();

    render(
      <Button disabled onPress={onPress}>
        Save album
      </Button>,
    );

    fireEvent.press(screen.getByText("Save album"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("shows a loading label and prevents repeated presses while loading", () => {
    const onPress = jest.fn();

    render(
      <Button loading loadingText="Saving" onPress={onPress}>
        Save album
      </Button>,
    );

    fireEvent.press(screen.getByText("Saving"));

    expect(screen.getByText("Saving")).toBeTruthy();
    expect(onPress).not.toHaveBeenCalled();
  });
});
