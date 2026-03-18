"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/remove-bg';

  const handleProcess = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const formData = new FormData();
      formData.append("image_file", selectedFile);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Processing failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = "removed-bg.png";
    link.click();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 sm:p-8">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        {/* Header */}
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-8">
          🖼️ Image Background Remover
        </h1>

        {/* Upload Area */}
        <div
          className={`border-3 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 mb-6
            ${
              isDragging
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
            }`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          {previewUrl ? (
            <div className="relative w-full h-48">
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <>
              <div className="text-5xl mb-3">📁</div>
              <p className="text-gray-600">Click or drag image here</p>
            </>
          )}
        </div>

        {/* Process Button */}
        <button
          onClick={handleProcess}
          disabled={!selectedFile || loading}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium
            transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? "Processing..." : "Remove Background"}
        </button>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center items-center my-6">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-indigo-500"></div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        {/* Result */}
        {resultUrl && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Result:</h3>
            <div className="relative w-full h-48 bg-checkerboard rounded-lg overflow-hidden mb-4">
              <Image
                src={resultUrl}
                alt="Result"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Download
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                New Image
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
