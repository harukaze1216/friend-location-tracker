import React, { useState, useEffect } from 'react';
import MapViewer from './components/MapViewer';
import LocationForm from './components/LocationForm';
import LocationList from './components/LocationList';
import LoginButton from './components/LoginButton';
import { Location, MapPoint } from './types';
import { addLocation, getLocations, deleteLocation } from './services/locationService';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  const { user } = useAuth();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLocations();
    loadDefaultPdf();
  }, []);

  const loadDefaultPdf = () => {
    const defaultPdfUrl = `${process.env.PUBLIC_URL}/location_map.pdf`;
    setPdfUrl(defaultPdfUrl);
  };

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setPdfUrl('');
    } else {
      alert('PDFファイルを選択してください');
    }
  };

  const handleMapClick = (point: MapPoint) => {
    setSelectedPoint(point);
  };

  const handleLocationSubmit = async (data: {
    friendName: string;
    time: string;
    description?: string;
  }) => {
    if (!selectedPoint || !user) return;

    try {
      setLoading(true);
      const newLocation: Omit<Location, 'id' | 'timestamp'> = {
        ...data,
        x: selectedPoint.x,
        y: selectedPoint.y,
        userId: user.uid,
        userDisplayName: user.displayName || 'Unknown User',
      };
      
      await addLocation(newLocation);
      await loadLocations();
      setSelectedPoint(null);
    } catch (error) {
      console.error('Failed to add location:', error);
      alert('位置情報の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationDelete = async (id: string) => {
    if (window.confirm('この位置情報を削除しますか？')) {
      try {
        setLoading(true);
        await deleteLocation(id);
        await loadLocations();
      } catch (error) {
        console.error('Failed to delete location:', error);
        alert('位置情報の削除に失敗しました');
      } finally {
        setLoading(false);
      }
    }
  };

  let filteredLocations = locations;
  if (selectedTime) {
    filteredLocations = filteredLocations.filter(loc => loc.time === selectedTime);
  }
  if (selectedUser) {
    filteredLocations = filteredLocations.filter(loc => loc.userId === selectedUser);
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">リベ大フェス 友達位置トラッカー</h1>
          <p className="text-gray-600 mb-6">利用するにはログインが必要です</p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            リベ大フェス 友達位置トラッカー
          </h1>
          <LoginButton />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">地図をアップロード</h2>
          <p className="text-sm text-gray-600 mb-2">
            デフォルトの地図が読み込まれています。別の地図を使用する場合はアップロードしてください。
          </p>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">地図</h2>
            {pdfFile || pdfUrl ? (
              <MapViewer
                pdfFile={pdfFile}
                pdfUrl={pdfUrl}
                locations={filteredLocations}
                onMapClick={handleMapClick}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                地図を読み込み中...
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <LocationList
              locations={locations}
              selectedTime={selectedTime}
              selectedUser={selectedUser}
              onTimeFilter={setSelectedTime}
              onUserFilter={setSelectedUser}
              onDelete={handleLocationDelete}
            />
          </div>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded">読み込み中...</div>
          </div>
        )}

        {user && (
          <LocationForm
            selectedPoint={selectedPoint}
            onSubmit={handleLocationSubmit}
            onCancel={() => setSelectedPoint(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
