import React, { useState, useRef } from 'react';
import './AdminCsvUploader.css';


const AdminCsvUploader = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState({
        message: '',
        successfulEntries: 0,
        invalidEntries: 0,
        validEntries: 0,
        errors: [],
    });


    const fileInputRef = useRef(null);


    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setUploadStatus({ message: '', successfulEntries: 0, invalidEntries: 0, validEntries: 0, errors: [] });
        if (file && file.type === "text/csv") {
            setSelectedFile(file);
        } else {
            alert("Please select a valid .csv file.");
            setSelectedFile(null);
        }
    };


    const handleUpload = async () => {
        if (!selectedFile) return;
        setIsLoading(true);
        setUploadStatus({ message: '', successfulEntries: 0, invalidEntries: 0, validEntries: 0, errors: [] });


        const formData = new FormData();
        formData.append('csvFile', selectedFile);


        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication token not found.');


            const response = await fetch('/api/admin/upload-csv', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });


            const data = await response.json();
           
            // Handle cases where fetch succeeds but the server returns an error (like 400 or 500)
            if (!response.ok) {
                 setUploadStatus({
                    message: data.message || 'An error occurred on the server.',
                    errors: data.errors || [],
                    invalidEntries: data.invalidEntries || 0,
                    validEntries: data.validEntries || 0,
                });
            } else {
                setUploadStatus(data); // The backend response directly maps to our state
            }


        } catch (error) {
            console.error('Upload failed:', error);
            setUploadStatus({ message: error.message || 'A network error occurred.', errors: [] });
        } finally {
            setIsLoading(false);
            // --- THIS IS THE FIX ---
            // Reset the file input's value. This allows the user to select the
            // same file again and trigger the onChange event correctly.
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
        }
    };


    const triggerFileSelect = () => fileInputRef.current.click();


    return (
        <div className="csv-uploader-container">
            <div className="card-header">
                <h3>Upload Consumption Data</h3>
                <p>Select a .csv file with columns: `towerNo`, `flatNo`, `date`, `cumulative units consumed`</p>
            </div>


            <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={isLoading}
            />


            <div className="controls-area">
                 <button onClick={triggerFileSelect} className="btn btn-select" disabled={isLoading}>
                    {selectedFile ? 'Change File' : 'Choose File'}
                </button>


                {selectedFile && (
                    <div className="file-info">
                        <span>{selectedFile.name}</span>
                        <button onClick={handleUpload} className="btn btn-upload" disabled={isLoading}>
                            {isLoading ? 'Uploading...' : 'Upload & Validate'}
                        </button>
                    </div>
                )}
            </div>




            {uploadStatus.message && (
                <div className="status-container">
                    <div className={`upload-status ${uploadStatus.errors && uploadStatus.errors.length > 0 ? 'status-error' : 'status-success'}`}>
                        <p>{uploadStatus.message}</p>
                        {uploadStatus.successfulEntries > 0 && <span>Successful Entries: <strong>{uploadStatus.successfulEntries}</strong></span>}
                        {uploadStatus.invalidEntries > 0 && <span>Invalid Entries: <strong>{uploadStatus.invalidEntries}</strong></span>}
                        {uploadStatus.validEntries > 0 && <span>Valid Entries Found: <strong>{uploadStatus.validEntries}</strong></span>}
                    </div>


                    {uploadStatus.errors && uploadStatus.errors.length > 0 && (
                        <div className="error-table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Row No.</th>
                                        <th>Tower</th>
                                        <th>Flat</th>
                                        <th>Date</th>
                                        <th>Value</th>
                                        <th>Reason for Error</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {uploadStatus.errors.map((row, index) => (
                                        <tr key={index}>
                                            <td>{row.originalRowNumber}</td>
                                            <td>{row.towerNo || 'N/A'}</td>
                                            <td>{row.flatNo || 'N/A'}</td>
                                            <td>{row.date || 'N/A'}</td>
                                            <td>{row.consumption_kwh === undefined ? 'N/A' : String(row.consumption_kwh)}</td>
                                            <td>{row.error}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


export default AdminCsvUploader;





