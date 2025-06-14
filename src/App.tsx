import React, { useState, useEffect } from 'react';
import MapViewer from './components/MapViewer';
import LocationForm from './components/LocationForm';
import LocationList from './components/LocationList';
import LoginButton from './components/LoginButton';
import UserProfileSetup from './components/UserProfileSetup';
import MyLocationForm from './components/MyLocationForm';
import ProfileEdit from './components/ProfileEdit';
import ScheduledLocationsList from './components/ScheduledLocationsList';
import { Location, MapPoint, UserProfile, UserLocation } from './types';
import { addLocation, getLocations, deleteLocation } from './services/locationService';
import { 
  createUserProfile, 
  getUserProfile, 
  updateUserProfile,
  addUserLocation, 
  updateUserLocation,
  deleteUserLocation,
  getActiveUserLocations
} from './services/userService';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  const { user } = useAuth();
  const [pdfUrl] = useState<string>('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [userProfiles, setUserProfiles] = useState<{ [uid: string]: UserProfile }>({});
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [locationTypeFilter, setLocationTypeFilter] = useState<'all' | 'current' | 'scheduled'>('all');
  const [myLocationFormData, setMyLocationFormData] = useState<{ position: MapPoint; currentLocation?: UserLocation } | null>(null);
  const [showScheduledLocationsList, setShowScheduledLocationsList] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadUserLocations();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps


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
      const profiles: { [uid: string]: UserProfile } = { ...userProfiles }; // 既存のプロフィールを保持
      const uniqueUserIds = Array.from(new Set(allUserLocations.map(ul => ul.userId)));
      
      for (const userId of uniqueUserIds) {
        if (!profiles[userId]) {
          try {
            const profile = await getUserProfile(userId);
            if (profile) {
              profiles[userId] = profile;
            } else {
              console.warn('Profile not found for user:', userId);
            }
          } catch (error) {
            console.error(`Failed to load profile for user ${userId}:`, error);
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


  const handleMapClick = (point: MapPoint) => {
    if (!currentUserProfile?.profileCompleted) return;
    
    // 新しい位置登録のため、常にcurrentLocationはnullにする（編集モードではなく新規登録）
    setMyLocationFormData({
      position: point,
      currentLocation: undefined
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

  const handleProfileEdit = async (updatedData: Partial<UserProfile>) => {
    if (!currentUserProfile) return;

    try {
      setLoading(true);
      await updateUserProfile(currentUserProfile.uid, updatedData);
      
      const updatedProfile = { ...currentUserProfile, ...updatedData };
      setCurrentUserProfile(updatedProfile);
      setShowProfileEdit(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('プロフィール更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleMyLocationSubmit = async (data: { 
    date: string;
    time: string; 
    endTime?: string; 
    comment: string; 
    locationType: 'current' | 'scheduled';
  }) => {
    if (!myLocationFormData || !user) return;

    try {
      setLoading(true);
      
      if (myLocationFormData.currentLocation) {
        // 既存の位置を更新
        const updateData: any = {
          x: myLocationFormData.position.x,
          y: myLocationFormData.position.y,
          date: data.date,
          time: data.time,
          locationType: data.locationType,
        };
        if (data.endTime) {
          updateData.endTime = data.endTime;
        }
        if (data.comment && data.comment.trim()) {
          updateData.comment = data.comment.trim();
        }
        await updateUserLocation(myLocationFormData.currentLocation.id, updateData);
      } else {
        // 新しい位置を作成
        const newLocationData: any = {
          userId: user.uid,
          x: myLocationFormData.position.x,
          y: myLocationFormData.position.y,
          date: data.date,
          time: data.time,
          locationType: data.locationType,
          isActive: true,
        };
        if (data.endTime) {
          newLocationData.endTime = data.endTime;
        }
        if (data.comment && data.comment.trim()) {
          newLocationData.comment = data.comment.trim();
        }
        await addUserLocation(newLocationData);
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

  const handleUserLocationDrag = async (userLocationId: string, point: MapPoint) => {
    const userLocation = userLocations.find(ul => ul.id === userLocationId);
    if (!userLocation || userLocation.userId !== user?.uid) return;

    try {
      await updateUserLocation(userLocationId, {
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

  const handleUserLocationDelete = async () => {
    if (!myLocationFormData?.currentLocation) return;
    
    if (window.confirm('この位置情報を削除しますか？')) {
      try {
        setLoading(true);
        await deleteUserLocation(myLocationFormData.currentLocation.id);
        await loadUserLocations();
        setMyLocationFormData(null);
      } catch (error) {
        console.error('Failed to delete user location:', error);
        alert('位置情報の削除に失敗しました');
      } finally {
        setLoading(false);
      }
    }
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
  if (selectedDate) {
    filteredUserLocations = filteredUserLocations.filter(loc => loc.date === selectedDate);
  }
  if (locationTypeFilter !== 'all') {
    filteredUserLocations = filteredUserLocations.filter(loc => loc.locationType === locationTypeFilter);
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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center mb-4 py-2">
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold">
            リベ大フェス 友達位置トラッカー
          </h1>
          <LoginButton />
        </div>

        {currentUserProfile?.profileCompleted && (
          <div className="bg-white rounded-lg shadow-md p-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentUserProfile.avatarUrl ? (
                  <img 
                    src={currentUserProfile.avatarUrl} 
                    alt={currentUserProfile.displayName}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                    {currentUserProfile.displayName.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-sm sm:text-md font-bold">{currentUserProfile.displayName}</h2>
                  {currentUserProfile.libeCityName && (
                    <p className="text-xs text-gray-600">{currentUserProfile.libeCityName}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowScheduledLocationsList(true)}
                    className="text-xs text-orange-600 hover:text-orange-700 underline flex items-center gap-1"
                  >
                    📅 予定一覧
                    {userLocations.filter(ul => ul.locationType === 'scheduled' && ul.userId === user?.uid).length > 0 && (
                      <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                        {userLocations.filter(ul => ul.locationType === 'scheduled' && ul.userId === user?.uid).length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowProfileEdit(true)}
                    className="text-xs text-gray-500 hover:text-blue-600 underline"
                  >
                    編集
                  </button>
                </div>
                <p className="text-xs text-blue-600 hidden sm:block">地図をクリックして位置を設定・更新</p>
                <p className="text-xs text-blue-600 sm:hidden">タップして位置設定</p>
              </div>
            </div>
          </div>
        )}

        {/* フィルタ機能 */}
        {currentUserProfile?.profileCompleted && (
          <div className="bg-white rounded-lg shadow-md p-3 mb-3">
            <h3 className="text-sm font-semibold mb-2">フィルタ</h3>
            <div className="space-y-3">
              {/* クイックフィルター */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setLocationTypeFilter('scheduled');
                    setSelectedUser(user?.uid || '');
                  }}
                  className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs hover:bg-orange-600 transition-colors"
                >
                  📅 自分の予定
                </button>
                <button
                  onClick={() => {
                    setLocationTypeFilter('current');
                    setSelectedUser('');
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs hover:bg-blue-600 transition-colors"
                >
                  📍 現在地一覧
                </button>
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setSelectedDate(today);
                    setLocationTypeFilter('all');
                  }}
                  className="px-3 py-1 bg-green-500 text-white rounded-full text-xs hover:bg-green-600 transition-colors"
                >
                  📅 今日
                </button>
              </div>
              
              {/* 詳細フィルター */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">位置タイプ</label>
                <select
                  value={locationTypeFilter}
                  onChange={(e) => setLocationTypeFilter(e.target.value as 'all' | 'current' | 'scheduled')}
                  className="w-full p-2 border border-gray-300 rounded text-xs sm:text-sm touch-manipulation"
                >
                  <option value="all">すべて表示</option>
                  <option value="current">📍 現在地のみ</option>
                  <option value="scheduled">📅 予定地のみ</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">日付で絞り込み</label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-xs sm:text-sm touch-manipulation"
                >
                  <option value="">すべての日付</option>
                  {Array.from(new Set(userLocations.map(ul => ul.date).filter(Boolean))).sort().map(date => {
                    const dateObj = new Date(date + 'T00:00:00');
                    const monthDay = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
                    return (
                      <option key={date} value={date}>{monthDay}</option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">時間で絞り込み</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-xs sm:text-sm touch-manipulation"
                >
                  <option value="">すべての時間</option>
                  {Array.from(new Set([...locations.map(l => l.time), ...userLocations.map(ul => ul.time)])).sort().map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ユーザーで絞り込み</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-xs sm:text-sm touch-manipulation"
                >
                  <option value="">すべてのユーザー</option>
                  {Object.values(userProfiles).map(profile => (
                    <option key={profile.uid} value={profile.uid}>{profile.displayName}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setLocationTypeFilter('all');
                    setSelectedDate('');
                    setSelectedTime('');
                    setSelectedUser('');
                  }}
                  className="w-full px-3 py-2 bg-gray-500 text-white rounded text-xs sm:text-sm hover:bg-gray-600 touch-manipulation min-h-[44px]"
                >
                  フィルタをクリア
                </button>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* 地図表示 - 大きく表示 */}
        <div className="bg-white rounded-lg shadow-md p-2 sm:p-4 mb-4">
          <h2 className="text-md sm:text-lg font-bold mb-2 sm:mb-4">リベ大フェス会場マップ</h2>
          {pdfUrl || process.env.PUBLIC_URL ? (
            <MapViewer
              pdfFile={null}
              pdfUrl={`${process.env.PUBLIC_URL}/location_map.pdf`}
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

        {/* 位置情報リスト - コンパクト表示 */}
        {currentUserProfile?.profileCompleted && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <LocationList
              locations={locations}
              selectedTime={selectedTime}
              selectedUser={selectedUser}
              onTimeFilter={setSelectedTime}
              onUserFilter={setSelectedUser}
              onDelete={handleLocationDelete}
            />
          </div>
        )}

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

        {/* プロフィール編集ダイアログ */}
        {showProfileEdit && currentUserProfile && (
          <ProfileEdit
            currentProfile={currentUserProfile}
            onSave={handleProfileEdit}
            onCancel={() => setShowProfileEdit(false)}
          />
        )}

        {/* 自分の位置設定ダイアログ */}
        {myLocationFormData && (
          <MyLocationForm
            position={myLocationFormData.position}
            currentLocation={myLocationFormData.currentLocation}
            onSubmit={handleMyLocationSubmit}
            onDelete={myLocationFormData.currentLocation ? handleUserLocationDelete : undefined}
            onCancel={() => setMyLocationFormData(null)}
          />
        )}

        {/* 予定地一覧ダイアログ */}
        {showScheduledLocationsList && (
          <ScheduledLocationsList
            userLocations={userLocations}
            userProfiles={userProfiles}
            currentUserId={user?.uid}
            onLocationClick={handleUserLocationClick}
            onClose={() => setShowScheduledLocationsList(false)}
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
