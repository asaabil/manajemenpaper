
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

// Fetch top downloaded papers
const fetchTopDownloaded = async () => {
  const { data } = await api.get('/stats/top-d');
  return data.data; // Assuming API response is { success, data: [...] }
};

export const useTopDownloadedPapers = () => {
  return useQuery({ queryKey: ['statsTopDownloaded'], queryFn: fetchTopDownloaded });
};

// Fetch top viewed papers
const fetchTopViewed = async () => {
  const { data } = await api.get('/stats/papers/top-viewed');
  return data.data; // Assuming API response is { success, data: [...] }
};

export const useTopViewedPapers = () => {
  return useQuery({ queryKey: ['statsTopViewed'], queryFn: fetchTopViewed });
};
