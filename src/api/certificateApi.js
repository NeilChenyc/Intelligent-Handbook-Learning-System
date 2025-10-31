// Certificate related API calls
import { API_BASE_URL } from '../config/api';

/**
 * Get all certificates with user visibility logic
 */
export const getCertificates = async (userId = null) => {
  try {
    const url = userId ? `${API_BASE_URL}/certificates?userId=${userId}` : `${API_BASE_URL}/certificates`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const certificates = await response.json();
    return certificates;
  } catch (error) {
    console.error('Error fetching certificates:', error);
    throw error;
  }
};

/**
 * Get certificate by course ID
 */
export const getCertificateByCourseId = async (courseId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/certificates/course/${courseId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No certificate found for this course
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const certificate = await response.json();
    return certificate;
  } catch (error) {
    console.error('Error fetching certificate by course ID:', error);
    throw error;
  }
};

/**
 * Create certificate for course (called when course is uploaded)
 */
export const createCertificateForCourse = async (courseId, certificateData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/certificates/course/${courseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(certificateData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const certificate = await response.json();
    return certificate;
  } catch (error) {
    console.error('Error creating certificate for course:', error);
    throw error;
  }
};

/**
 * Update certificate metadata
 */
export const updateCertificate = async (certificateId, certificateData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/certificates/${certificateId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(certificateData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const certificate = await response.json();
    return certificate;
  } catch (error) {
    console.error('Error updating certificate:', error);
    throw error;
  }
};

/**
 * Get user's certificates
 */
export const getUserCertificates = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/certificates/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const certificates = await response.json();
    return certificates;
  } catch (error) {
    console.error('Error fetching user certificates:', error);
    throw error;
  }
};

/**
 * Get user's active certificates
 */
export const getUserActiveCertificates = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/certificates/user/${userId}/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const certificates = await response.json();
    return certificates;
  } catch (error) {
    console.error('Error fetching user active certificates:', error);
    throw error;
  }
};

/**
 * Award certificate to user (called when course is completed)
 */
export const awardCertificate = async (userId, courseId, finalScore, completionPercentage) => {
  try {
    const response = await fetch(`${API_BASE_URL}/certificates/award?userId=${userId}&courseId=${courseId}&finalScore=${finalScore}&completionPercentage=${completionPercentage}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const userCertificate = await response.json();
    return userCertificate;
  } catch (error) {
    console.error('Error awarding certificate:', error);
    throw error;
  }
};

/**
 * Get certificate by certificate number
 */
export const getCertificateByCertificateNumber = async (certificateNumber) => {
  try {
    const response = await fetch(`${API_BASE_URL}/certificates/number/${certificateNumber}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Certificate not found
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const certificate = await response.json();
    return certificate;
  } catch (error) {
    console.error('Error fetching certificate by number:', error);
    throw error;
  }
};

/**
 * Download certificate as HTML
 */
export const downloadCertificate = async (userCertificateId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/certificates/${userCertificateId}/download`, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Certificate not found');
      }
      throw new Error(`Download failed, status: ${response.status}`);
    }

    const htmlContent = await response.text();
    return htmlContent;
  } catch (error) {
    console.error('Error downloading certificate:', error);
    throw error;
  }
};

/**
 * Check if user is eligible for certificate
 */
export const checkCertificateEligibility = async (userId, courseId, userScore) => {
  try {
    const response = await fetch(`${API_BASE_URL}/certificates/eligible?userId=${userId}&courseId=${courseId}&userScore=${userScore}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const eligible = await response.json();
    return eligible;
  } catch (error) {
    console.error('Error checking certificate eligibility:', error);
    throw error;
  }
};

/**
 * Generate certificate HTML content from template
 */
export const generateCertificateHtml = (userCertificate, user) => {
  const template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate of Completion</title>
    <style>
        body {
            font-family: 'Georgia', serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .certificate {
            background: white;
            padding: 60px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 800px;
            width: 100%;
            text-align: center;
            border: 8px solid #f8f9fa;
            position: relative;
        }
        .certificate::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 3px solid #667eea;
            border-radius: 10px;
        }
        .header {
            margin-bottom: 40px;
        }
        .title {
            font-size: 48px;
            color: #2c3e50;
            margin-bottom: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        .subtitle {
            font-size: 24px;
            color: #667eea;
            margin-bottom: 40px;
        }
        .recipient {
            font-size: 32px;
            color: #2c3e50;
            margin: 30px 0;
            font-weight: bold;
        }
        .course-name {
            font-size: 28px;
            color: #667eea;
            margin: 20px 0;
            font-style: italic;
        }
        .details {
            margin: 40px 0;
            font-size: 16px;
            color: #555;
            line-height: 1.6;
        }
        .score {
            font-size: 20px;
            color: #27ae60;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .signature {
            text-align: center;
        }
        .signature-line {
            border-top: 2px solid #2c3e50;
            width: 200px;
            margin: 20px auto 10px;
        }
        .date {
            font-size: 14px;
            color: #666;
        }
        .certificate-number {
            font-size: 12px;
            color: #999;
            margin-top: 20px;
        }
        .seal {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <div class="title">Certificate</div>
            <div class="subtitle">of Completion</div>
        </div>
        
        <div class="content">
            <p style="font-size: 18px; margin-bottom: 20px;">This is to certify that</p>
            <div class="recipient">${user.fullName || user.username}</div>
            <p style="font-size: 18px; margin: 20px 0;">has successfully completed the course</p>
            <div class="course-name">${userCertificate.certificate.certificateName}</div>
            
            <div class="details">
                <p><strong>Issuer:</strong> ${userCertificate.certificate.issuer}</p>
                <p><strong>Department:</strong> ${userCertificate.certificate.course.department || 'General'}</p>
                <p><strong>Level:</strong> ${userCertificate.certificate.certificateLevel}</p>
                <p><strong>Description:</strong> ${userCertificate.certificate.description || 'No description available'}</p>
            </div>
            
            <div class="score">
                Completion: ${userCertificate.completionPercentage}%
            </div>
        </div>
        
        <div class="footer">
            <div class="signature">
                <div class="signature-line"></div>
                <div>Authorized Signature</div>
                <div class="date">Date: ${new Date(userCertificate.earnedDate).toLocaleDateString()}</div>
            </div>
            
            <div class="seal">
                <div>CERTIFIED</div>
            </div>
        </div>
        
        <div class="certificate-number">
            Certificate Number: ${userCertificate.certificateNumber}
            ${userCertificate.expiryDate ? `| Valid Until: ${new Date(userCertificate.expiryDate).toLocaleDateString()}` : '| Valid Permanently'}
        </div>
    </div>
</body>
</html>`;
  
  return template;
};

/**
 * Download certificate as HTML file
 */
export const downloadCertificateAsFile = async (userCertificateId, fileName) => {
  try {
    const htmlContent = await downloadCertificate(userCertificateId);
    
    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `certificate_${userCertificateId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading certificate file:', error);
    throw error;
  }
};