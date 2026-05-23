import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// AUTH
export const loginUser = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);
  const res = await api.post("/login", formData);
  return res.data;
};

// ADMIN
export const createStudent = async (data) => {
  const res = await api.post("/admin/create-student", data);
  return res.data;
};

export const createFaculty = async (data) => {
  const res = await api.post("/admin/create-faculty", data);
  return res.data;
};

export const createClass = async (data) => {
  const res = await api.post("/admin/create-class", data);
  return res.data;
};

export const assignFaculty = async (data) => {
  const res = await api.post("/admin/assign-faculty", data);
  return res.data;
};

export const getAdminOverview = async () => {
  const res = await api.get("/admin/overview");
  return res.data;
};

export const getAllStudents = async () => {
  const res = await api.get("/admin/students");
  return res.data;
};

export const getClasses = async () => {
  const res = await api.get("/classes");
  return res.data;
};

export const getFacultyList = async () => {
  const res = await api.get("/faculty-list");
  return res.data;
};

// FACULTY
export const getMyAssignments = async () => {
  const res = await api.get("/faculty/my-assignments");
  return res.data;
};

export const facultyAddMarks = async (data) => {
  const res = await api.post("/faculty/marks", data);
  return res.data;
};

export const facultyAddAttendance = async (data) => {
  const res = await api.post("/faculty/attendance", data);
  return res.data;
};

export const getClassStudents = async (classId) => {
  const res = await api.get(`/faculty/class-students/${classId}`);
  return res.data;
};

// ANALYSIS
export const getStudentAnalysis = async (prn) => {
  const res = await api.get(`/analysis/student/${prn}`);
  return res.data;
};

export const getClassAnalysis = async (classId) => {
  const res = await api.get(`/analysis/class/${classId}`);
  return res.data;
};

export const getFacultyAnalysis = async (facultyId) => {
  const res = await api.get(`/analysis/faculty/${facultyId}`);
  return res.data;
};

// RESOURCES
export const getAllResources = async () => {
  const res = await api.get("/resources");
  return res.data;
};

export const addResource = async (data) => {
  const res = await api.post("/resources", data);
  return res.data;
};

export const getMLRecommendations = async (prn) => {
  const res = await api.get(`/recommendations/ml/${prn}`);
  return res.data;
};
export default api;