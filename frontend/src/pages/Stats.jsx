import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTopDownloadedPapers, useTopViewedPapers } from '../hooks/useStats';
import Spinner from '../components/Spinner';

const Stats = () => {
  const { data: topDownloaded, isLoading: isLoadingDownloaded, isError: isErrorDownloaded } = useTopDownloadedPapers();
  const { data: topViewed, isLoading: isLoadingViewed, isError: isErrorViewed } = useTopViewedPapers();

  if (isLoadingDownloaded || isLoadingViewed) {
    return <Spinner />;
  }

  if (isErrorDownloaded || isErrorViewed) {
    return <p className="text-red-500">Error loading stats. Please try again later.</p>;
  }

  // Defensive check: Ensure data is an array and has content.
  const hasDownloadedData = Array.isArray(topDownloaded) && topDownloaded.length > 0;
  const hasViewedData = Array.isArray(topViewed) && topViewed.length > 0;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Paper Statistics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Downloaded Papers Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Top 10 Downloaded Papers</h2>
          {hasDownloadedData ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topDownloaded} margin={{ top: 5, right: 20, left: 10, bottom: 120 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" angle={-60} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" />
                <Bar dataKey="downloadCount" fill="#8884d8" name="Downloads" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">No download statistics available.</p>
          )}
        </div>

        {/* Top Viewed Papers Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Top 10 Viewed Papers</h2>
          {hasViewedData ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={topViewed} margin={{ top: 5, right: 20, left: 10, bottom: 120 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" angle={-60} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" />
                <Line type="monotone" dataKey="viewCount" stroke="#82ca9d" name="Views" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">No view statistics available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stats;