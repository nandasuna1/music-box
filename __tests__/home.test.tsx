import Home from "@/app/(protected)/(tabs)";
import { render, screen } from "@testing-library/react-native";

describe("Login screen", () => {
  it("renders login title", () => {
    render(<Home />);

    expect(screen.getByText("vinyl.")).toBeTruthy();
  });
});
