import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const TestQuizPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/questions/quiz/1`);
        const result = await response.json();
        console.log('Raw API data:', result);
        setData(result);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1>API 数据测试</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      
      {data && data[0] && (
        <div className="mt-4">
          <h2>第一题选项:</h2>
          {data[0].options.map((option, index) => (
            <div key={option.id} className="p-2 border mb-2">
              <strong>{String.fromCharCode(97 + index).toUpperCase()}.</strong> {option.optionText}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestQuizPage;