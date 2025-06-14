import React, { useState, useEffect } from 'react';
import MapViewer from './components/MapViewer';
import LocationForm from './components/LocationForm';
import LocationList from './components/LocationList';
import LoginButton from './components/LoginButton';
import UserProfileSetup from './components/UserProfileSetup';
import MyLocationForm from './components/MyLocationForm';
import { Location, MapPoint, UserProfile, UserLocation } from './types';
import { addLocation, getLocations, deleteLocation } from './services/locationService';
import { 
  createUserProfile, 
  getUserProfile, 
  addUserLocation, 
  updateUserLocation,
  getActiveUserLocations
} from './services/userService';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  const { user } = useAuth();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [userProfiles, setUserProfiles] = useState<{ [uid: string]: UserProfile }>({});
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [myLocationFormData, setMyLocationFormData] = useState<{ position: MapPoint; currentLocation?: UserLocation } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLocations();
    loadDefaultPdf();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadUserLocations();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDefaultPdf = () => {
    const defaultPdfUrl = `${process.env.PUBLIC_URL}/location_map.pdf`;
    console.log('PDF URL:', defaultPdfUrl);
    setPdfUrl(defaultPdfUrl);
  };

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setCurrentUserProfile(profile);
        if (!profile.profileCompleted) {
          setShowProfileSetup(true);
        }
      } else {
        setShowProfileSetup(true);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setShowProfileSetup(true);
    }
  };

  const loadUserLocations = async () => {
    try {
      const allUserLocations = await getActiveUserLocations();
      setUserLocations(allUserLocations);
      
      // ユーザープロフィールを個別に取得
      const profiles: { [uid: string]: UserProfile } = {};
      for (const userLocation of allUserLocations) {
        if (!profiles[userLocation.userId]) {
          try {
            const profile = await getUserProfile(userLocation.userId);
            if (profile) {
              profiles[userLocation.userId] = profile;
            }
          } catch (error) {
            console.error(`Failed to load profile for user ${userLocation.userId}:`, error);
          }
        }
      }
      setUserProfiles(profiles);
    } catch (error) {
      console.error('Failed to load user locations:', error);
    }
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
    if (!currentUserProfile?.profileCompleted) return;
    
    // 自分の現在位置があるかチェック
    const currentUserLocation = userLocations.find(ul => ul.userId === user?.uid && ul.isActive);
    
    setMyLocationFormData({
      position: point,
      currentLocation: currentUserLocation
    });
  };

  const handleProfileComplete = async (profileData: Omit<UserProfile, 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      await createUserProfile(profileData);
      setCurrentUserProfile({
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setShowProfileSetup(false);
    } catch (error) {
      console.error('Failed to create profile:', error);
      alert('プロフィール作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleMyLocationSubmit = async (data: { time: string; comment: string }) => {
    if (!myLocationFormData || !user) return;

    try {
      setLoading(true);
      
      if (myLocationFormData.currentLocation) {
        // 既存の位置を更新
        await updateUserLocation(myLocationFormData.currentLocation.id, {
          x: myLocationFormData.position.x,
          y: myLocationFormData.position.y,
          time: data.time,
          comment: data.comment || undefined,
        });
      } else {
        // 新しい位置を作成
        await addUserLocation({
          userId: user.uid,
          x: myLocationFormData.position.x,
          y: myLocationFormData.position.y,
          time: data.time,
          comment: data.comment || undefined,
          isActive: true,
        });
      }
      
      await loadUserLocations();
      setMyLocationFormData(null);
    } catch (error) {
      console.error('Failed to save user location:', error);
      alert('位置情報の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleUserLocationDrag = async (userId: string, point: MapPoint) => {
    if (userId !== user?.uid) return;
    
    const userLocation = userLocations.find(ul => ul.userId === userId && ul.isActive);
    if (!userLocation) return;

    try {
      await updateUserLocation(userLocation.id, {
        x: point.x,
        y: point.y,
      });
      await loadUserLocations();
    } catch (error) {
      console.error('Failed to update user location:', error);
      alert('位置の更新に失敗しました');
    }
  };

  const handleUserLocationClick = (userLocation: UserLocation) => {
    setMyLocationFormData({
      position: { x: userLocation.x, y: userLocation.y },
      currentLocation: userLocation
    });
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

  let filteredUserLocations = userLocations;
  if (selectedTime) {
    filteredUserLocations = filteredUserLocations.filter(loc => loc.time === selectedTime);
  }
  if (selectedUser) {
    filteredUserLocations = filteredUserLocations.filter(loc => loc.userId === selectedUser);
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

        {currentUserProfile?.profileCompleted && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                {currentUserProfile.avatarUrl ? (
                  <img 
                    src={currentUserProfile.avatarUrl} 
                    alt={currentUserProfile.displayName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {currentUserProfile.displayName.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold">{currentUserProfile.displayName}</h2>
                  {currentUserProfile.libeCityName && (
                    <p className="text-sm text-gray-600">{currentUserProfile.libeCityName}</p>
                  )}
                </div>
              </div>
              <div className="ml-auto">
                <p className="text-sm text-blue-600">地図をクリックして位置を設定・更新できます</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-md font-semibold mb-2">地図設定</h3>
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
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">地図</h2>
            {pdfFile || pdfUrl ? (
              <MapViewer
                pdfFile={pdfFile}
                pdfUrl={pdfUrl}
                locations={filteredLocations}
                userLocations={filteredUserLocations}
                userProfiles={userProfiles}
                currentUserId={user?.uid}
                onMapClick={handleMapClick}
                onUserLocationDrag={handleUserLocationDrag}
                onUserLocationClick={handleUserLocationClick}
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

        {/* プロフィール設定ダイアログ */}
        {showProfileSetup && user && (
          <UserProfileSetup
            user={user}
            onProfileComplete={handleProfileComplete}
          />
        )}

        {/* 自分の位置設定ダイアログ */}
        {myLocationFormData && (
          <MyLocationForm
            position={myLocationFormData.position}
            currentLocation={myLocationFormData.currentLocation}
            onSubmit={handleMyLocationSubmit}
            onCancel={() => setMyLocationFormData(null)}
          />
        )}

        {/* 従来の友達位置登録ダイアログ */}
        {user && selectedPoint && (
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
