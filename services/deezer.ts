// services/deezer.ts
import { create } from "axios";

export const deezerApi = create({
  baseURL: "https://api.deezer.com",
});
