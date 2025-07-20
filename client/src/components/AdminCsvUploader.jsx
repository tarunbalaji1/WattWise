import React, { useState, useRef } from 'react';
import './AdminCsvUploader.css'; // We'll create this file next for styling

const AdminCsvUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  // useRef is used to trigger the hidden file input
  const fileInputRef = useRef(null);

  // This function is called when the user selects a file
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/csv") {
      setSelectedFile(file);
    } else {
      alert("Please select a valid .csv file.");
      setSelectedFile(null);
    }
  };

  // This function will handle the upload to the backend
  const handleUpload = () => {
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append('csvFile', selectedFile);

    console.log("File is ready to be sent to the backend:", selectedFile.name);
    
    // --- BACKEND LOGIC WILL GO HERE ---
    // Example using axios (once the backend is ready):
    // axios.post('/api/upload/csv', formData, {
    //   headers: {
    //     'Content-Type': 'multipart/form-data'
    //   }
    // }).then(response => {
    //   alert('File uploaded successfully!');
    // }).catch(error => {
    //   console.error('Error uploading file:', error);
    //   alert('Error uploading file.');
    // });
    
    alert("File upload logic is ready. Connect to backend.");
  };

  // Triggers the hidden file input click
  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="csv-uploader-container">
      <h3>Upload Consumption Data</h3>
      <p>Please select a .csv file to upload the daily consumption data.</p>
      
      {/* Hidden file input */}
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      {/* Button to trigger file selection */}
      <button onClick={triggerFileSelect} className="btn-select-file">
        Choose File
      </button>

      {/* Display selected file name and the upload button */}
      {selectedFile && (
        <div className="file-info">
          <span>Selected file: <strong>{selectedFile.name}</strong></span>
          <button onClick={handleUpload} className="btn-upload">
            Upload
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminCsvUploader;