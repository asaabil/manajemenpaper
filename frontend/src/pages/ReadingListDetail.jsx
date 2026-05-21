
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import Spinner from '../components/Spinner';

const fetchReadingListDetail = async (id) => {
  const { data } = await api.get(`/reading-lists/${id}`);
  return data.data;
};

const ReadingListDetail = () => {
  const { id } = useParams();
  const { data: list, isLoading, isError, error } = useQuery({
    queryKey: ['readingList', id],
    queryFn: () => fetchReadingListDetail(id),
  });

  if (isLoading) return <Spinner />;
  if (isError) return <div className="text-red-500 container mx-auto p-4">Error: {error.message}</div>;
  if (!list) return <div className="container mx-auto p-4">Reading list not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link to="/reading-lists" className="text-indigo-600 hover:underline">← Back to Reading Lists</Link>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border dark:border-gray-700">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">{list.name}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Created by <span className="font-semibold">{list.owner?.name || 'Unknown'}</span>
        </p>

        <h2 className="text-xl font-semibold mb-4 dark:text-white border-b pb-2 dark:border-gray-700">Papers in this list</h2>
        <div className="space-y-4">
          {list.items && list.items.length > 0 ? list.items.map(item => (
            <div key={item._id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
              <Link to={`/papers/${item.paper?._id}`} className="text-xl font-bold text-indigo-700 dark:text-indigo-400 hover:underline">
                {item.paper?.title}
              </Link>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{item.paper?.authors?.join(', ')}</p>
            </div>
          )) : (
            <p className="text-gray-500 dark:text-gray-400 italic">No papers in this list yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadingListDetail;
