import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Award, Clock, Star, Calendar, Shield, FileText, Download, Eye, CheckCircle, Building } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getCertificates, getUserCertificates, downloadCertificate, downloadCertificateAsFile } from '../api/certificateApi';

const CertificatePage = () => {
  const [activeTab, setActiveTab] = useState('obtained');
  const [certificates, setCertificates] = useState([]);
  const [userCertificates, setUserCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Fetch certificates and user certificates on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const [allCertificates, userCerts] = await Promise.all([
          getCertificates(user.id),
          getUserCertificates(user.id)
        ]);
        
        setCertificates(allCertificates);
        setUserCertificates(userCerts);
      } catch (err) {
        console.error('Error fetching certificate data:', err);
        setError('Failed to load certificate data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Handle certificate download
  const handleDownload = async (userCertificateId, certificateNumber) => {
    try {
      await downloadCertificateAsFile(userCertificateId, `certificate-${certificateNumber}.html`);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate');
    }
  };

  // Handle certificate view
  const handleView = async (userCertificateId) => {
    try {
      const htmlContent = await downloadCertificate(userCertificateId);
      const win = window.open('', '_blank');
      if (win) {
        win.document.open();
        win.document.write(htmlContent);
        win.document.close();
      }
    } catch (error) {
      console.error('Error viewing certificate:', error);
      alert('Failed to view certificate');
    }
  };

  // Filter certificates based on user's obtained certificates
  const obtainedCertificates = userCertificates.filter(cert => cert.status === 'ACTIVE');
  const availableCertificates = certificates.filter(cert => 
    !userCertificates.some(userCert => userCert.certificate.id === cert.id)
  );

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Internal Learning Certification Center</h2>
          <p className="text-gray-600">Manage and view your company internal training certifications</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading certificates...</div>
        </div>
      </div>
    );
  }



  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Internal Learning Certification Center</h2>
        <p className="text-gray-600">Manage and view your company internal training certifications</p>
      </div>

      {/* Show error message if there's an error, but still show the UI */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600">{error}</div>
        </div>
      )}

      {/* Statistics overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{obtainedCertificates.length}</p>
                <p className="text-sm text-gray-600">Obtained Certifications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{availableCertificates.length}</p>
                <p className="text-sm text-gray-600">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {obtainedCertificates.filter(cert => cert.expiryDate && new Date(cert.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
                </p>
                <p className="text-sm text-gray-600">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'obtained', label: 'Obtained Certificates', count: obtainedCertificates.length },
              { id: 'available', label: 'Available', count: availableCertificates.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Obtained certifications */}
      {activeTab === 'obtained' && (
        <div className="space-y-6">
          {obtainedCertificates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates obtained yet</h3>
                <p className="text-gray-600">Complete courses to earn certificates</p>
              </CardContent>
            </Card>
          ) : (
            obtainedCertificates.map((userCert) => (
              <Card key={userCert.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Award className="w-8 h-8 text-yellow-500" />
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{userCert.certificate.certificateName}</h3>
                          <p className="text-gray-600">{userCert.certificate.issuer}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Issue Date</p>
                          <p className="font-medium">{new Date(userCert.earnedDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Valid Until</p>
                          <p className="font-medium">
                            {userCert.expiryDate ? new Date(userCert.expiryDate).toLocaleDateString() : 'No expiry'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Certificate Number</p>
                          <p className="font-medium">{userCert.certificateNumber}</p>
                        </div>
                        {false && (
                          <div>
                            <p className="text-sm text-gray-500">Final Score</p>
                            <p className="font-medium">{userCert.finalScore}%</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 mb-4">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {userCert.certificate.certificateLevel || 'Intermediate'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {userCert.status === 'ACTIVE' ? 'Valid' : userCert.status}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                          {userCert?.certificate?.course?.department || 'General'}
                        </span>
                      </div>

                      <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-2">Description</p>
                          <p 
                            className="text-gray-700"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {userCert.certificate.description || 'No description available'}
                          </p>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-6">
                      <Button 
                        size="sm" 
                        className="flex items-center space-x-1"
                        onClick={() => handleView(userCert.id)}
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center space-x-1"
                        onClick={() => handleDownload(userCert.id, userCert.certificateNumber)}
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* In progress certifications - removed since we don't track progress */}

      {/* Available certifications */}
      {activeTab === 'available' && (
        <div className="space-y-6">
          {availableCertificates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates available</h3>
                <p className="text-gray-600">Check back later for new certification opportunities</p>
              </CardContent>
            </Card>
          ) : (
            availableCertificates.map((cert) => (
              <Card key={cert.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Award className="w-8 h-8 text-blue-500" />
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{cert.certificateName}</h3>
                          <p className="text-gray-600">{cert.issuer}</p>
                        </div>
                      </div>
                      
                      <p 
                        className="text-gray-700 mb-4"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {cert.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Course</p>
                          <p className="font-medium">{cert?.course?.title || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Department</p>
                          <p className="font-medium">{cert?.course?.department || 'General'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Level</p>
                          <p className="font-medium">{cert.certificateLevel || 'Intermediate'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <p className="font-medium">{cert.isActive ? 'Active' : 'Inactive'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 mb-4">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {cert.certificateLevel || 'Intermediate'}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                          {cert?.course?.department || 'General'}
                        </span>
                      </div>

                      {cert.requirements && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-2">Requirements</p>
                          <p className="text-sm text-gray-700">{cert.requirements}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-6">
                      <Button 
                        className="flex items-center space-x-1"
                        onClick={() => {
                          const courseId = cert?.course?.id;
                          window.location.href = courseId ? `/courses/${courseId}` : '/courses';
                        }}
                      >
                        <Star className="w-4 h-4" />
                        <span>Start Learning</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CertificatePage;