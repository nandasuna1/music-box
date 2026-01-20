// services/deezer.ts
import axios from "axios";

export const deezerApi = axios.create({
  baseURL: "https://api.deezer.com",
});
