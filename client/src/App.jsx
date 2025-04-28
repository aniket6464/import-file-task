import React, { useState, useEffect } from "react";

const App = () => {
  const [file, setFile] = useState(null);
  const [importType, setImportType] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [page, setPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !importType) {
      alert("Please select file and import type");
      return;
    }
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("importType", importType);

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });
      

      const result = await response.json();

      if (response.ok) {
        setUploadResult(result);
        setError(null);
        fetchCompanies(1);

        // Clear success message after 2 seconds
        setTimeout(() => setUploadResult(null), 2000);
      } else {
        setError(result.error || "Something went wrong");

        // Clear error after 2 seconds
        setTimeout(() => setError(null), 2000);
      }
    } catch (err) {
      console.error(err);
      setError("Upload failed. Server not responding.");
    } finally {
      setIsUploading(false); 
      setImportType("");
    }
  };

  const fetchCompanies = async (page) => {
    try {
      const response = await fetch(`/api/companies?page=${page}`);
      const result = await response.json();

      if (response.ok) {
        setCompanies(result.data || []);
        setError(null);
      } else {
        setError(result.message || "Failed to fetch companies");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching companies");
    }
  };

  useEffect(() => {
    fetchCompanies(page);
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Company Importer</h1>

        {/* Upload Section */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full md:w-auto border border-gray-300 rounded px-4 py-2"
          />
          <select
            value={importType}
            onChange={(e) => setImportType(e.target.value)}
            className="block w-full md:w-auto border border-gray-300 rounded px-4 py-2"
          >
            <option value="">Select Import Mode</option>
            <option value="1">1. Create New Companies</option>
            <option value="2">2. Create New + Update (Without Overwrite)</option>
            <option value="3">3. Create New + Update (With Overwrite)</option>
            <option value="4">4. Update Existing (Without Overwrite)</option>
            <option value="5">5. Update Existing (With Overwrite)</option>
          </select>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {/* Result / Error */}
        {uploadResult && (
          <div className="bg-green-100 text-green-700 p-4 rounded mb-6">
            <p><strong>Inserted:</strong> {uploadResult.inserted}</p>
            <p><strong>Updated:</strong> {uploadResult.updated}</p>
            <p><strong>Skipped:</strong> {uploadResult.skipped}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Companies Table */}
        <br /> 
        <div className="overflow-x-auto">
          <h2 className="text-2xl font-bold mb-4 text-blue-600 text-center">Companies List</h2>
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Industry</th>
                <th className="px-4 py-2 border">Location</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Phone</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company, idx) => (
                <tr key={idx} className="hover:bg-gray-100">
                  <td className="px-4 py-2 border">{company.name}</td>
                  <td className="px-4 py-2 border">{company.industry}</td>
                  <td className="px-4 py-2 border">{company.location}</td>
                  <td className="px-4 py-2 border">{company.email}</td>
                  <td className="px-4 py-2 border">{company.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-6 space-x-4">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">{page}</span>
          <button
            onClick={() => setPage((prev) => prev + 1)}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
