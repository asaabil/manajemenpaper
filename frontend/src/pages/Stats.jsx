
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTopDownloadedPapers, useTopViewedPapers } from '../hooks/useStats';

const Stats = () => {
  const { data: topDownloaded, isLoading: isLoadingDownloaded, isError: isErrorDownloaded } = useTopDownloadedPapers();
  const { data: topViewed, isLoading: isLoadingViewed, isError: isErrorViewed } = useTopViewedPapers();

  if (isLoadingDownloaded || isLoadingViewed) return <Spinner />;
  if (isErrorDownloaded || isErrorViewed) return <p className="text-red-500">Error loading stats.</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Paper Statistics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Downloaded Papers Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Top 5 Downloaded Papers</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topDownloaded}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" angle={-15} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="downloadCount" fill="#8884d8" name="Downloads" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Viewed Papers Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Top 5 Viewed Papers</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={topViewed}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" angle={-15} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="viewCount" stroke="#82ca9d" name="Views" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Stats;
