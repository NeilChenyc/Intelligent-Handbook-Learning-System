import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Construction } from 'lucide-react';

const PlaceholderPage = ({ title, description }) => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Construction className="w-5 h-5 text-orange-500" />
            <span>Feature Under Development</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Construction className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">This feature is under development</h3>
            <p className="text-gray-600">We are working hard to provide you with a better learning experience. Stay tuned!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderPage;