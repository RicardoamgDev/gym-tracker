import axiosInstance from '../helpers/axiosInstance'

export const Auth = {
  register: (data) => axiosInstance.post('/register', data).then(r => r.data),
  login: (data) => axiosInstance.post('/login', data).then(r => r.data),
  me: () => axiosInstance.get('/me').then(r => r.data),
  logout: () => axiosInstance.post('/logout'),
}

export const MuscleGroups = {
  list: () => axiosInstance.get('/muscle-groups').then(r => r.data),
  create: (data) => axiosInstance.post('/muscle-groups', data).then(r => r.data),
}

export const Exercises = {
  list: () => axiosInstance.get('/exercises').then(r => r.data),
  create: (data) => axiosInstance.post('/exercises', data).then(r => r.data),
  remove: (id) => axiosInstance.delete(`/exercises/${id}`),
}

export const Workouts = {
  list: () => axiosInstance.get('/workouts').then(r => r.data),
  get: (id) => axiosInstance.get(`/workouts/${id}`).then(r => r.data),
  create: (data) => axiosInstance.post('/workouts', data).then(r => r.data),
  update: (id, data) => axiosInstance.put(`/workouts/${id}`, data).then(r => r.data),
  remove: (id) => axiosInstance.delete(`/workouts/${id}`),
}

export const Stats = {
  progression: (exerciseId) =>
    axiosInstance.get('/stats/progression', { params: { exercise_id: exerciseId } }).then(r => r.data),
  weeklyVolume: () => axiosInstance.get('/stats/weekly-volume').then(r => r.data),
  muscleDistribution: () => axiosInstance.get('/stats/muscle-distribution').then(r => r.data),
  calendar: () => axiosInstance.get('/stats/calendar').then(r => r.data),
}

export default axiosInstance
