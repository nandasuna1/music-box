import { TextField } from "@/components/TextField";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

describe("TextField", () => {
  it("reflects controlled values and reports edits", () => {
    const onChangeText = jest.fn();

    render(
      <TextField
        value="Daft Punk"
        onChangeText={onChangeText}
        placeholder="Search albums"
      />,
    );

    const input = screen.getByPlaceholderText("Search albums");
    expect(input.props.value).toBe("Daft Punk");

    fireEvent.changeText(input, "Discovery");

    expect(onChangeText).toHaveBeenCalledWith("Discovery");
  });

  it("does not accept edits when disabled", () => {
    const onChangeText = jest.fn();

    render(
      <TextField
        value=""
        onChangeText={onChangeText}
        placeholder="Search albums"
        disabled
      />,
    );

    const input = screen.getByPlaceholderText("Search albums");
    expect(input.props.editable).toBe(false);
  });

  it("renders an error state without changing the controlled value", () => {
    render(
      <TextField
        value=""
        onChangeText={jest.fn()}
        error="Required"
        placeholder="Comment"
      />,
    );

    expect(screen.getByText("Required")).toBeTruthy();
  });
});
