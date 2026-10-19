
import axios from "axios";

const api = axios.create({
  baseURL: "/api/",
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  withXSRFToken: true,
});

export default api;
