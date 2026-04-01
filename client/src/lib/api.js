import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

export const listingsApi = {
  getAll: (params) => api.get("/listings", { params }).then((r) => r.data),
  getById: (id) => api.get(`/listings/${id}`).then((r) => r.data),
};

export const analysisApi = {
  getStats: () => api.get("/analysis/stats").then((r) => r.data),
  runSingle: (id) => api.post(`/analysis/run/${id}`).then((r) => r.data),
};

export const watchlistApi = {
  getAll: (userId) => api.get("/watchlist", { params: { userId } }).then((r) => r.data),
  create: (data) => api.post("/watchlist", data).then((r) => r.data),
  remove: (id) => api.delete(`/watchlist/${id}`).then((r) => r.data),
};

export const trendsApi = {
  getModel: (brand, model, days) =>
    api.get("/trends/model", { params: { brand, model, days } }).then((r) => r.data),
  getListing: (id) => api.get(`/trends/listing/${id}`).then((r) => r.data),
};

export const scraperApi = {
  getStatus: () => api.get("/scraper/status").then((r) => r.data),
  trigger: () => api.post("/scraper/trigger").then((r) => r.data),
};

export const usersApi = {
  getAll: () => api.get("/users").then((r) => r.data),
  create: (data) => api.post("/users", data).then((r) => r.data),
  remove: (id) => api.delete(`/users/${id}`).then((r) => r.data),
};
