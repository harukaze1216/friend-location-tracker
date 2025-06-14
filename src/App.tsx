import React, { useState, useEffect } from 'react';
import MapViewer from './components/MapViewer';
import LocationForm from './components/LocationForm';
import LocationList from './components/LocationList';
import LoginButton from './components/LoginButton';
import UserProfileSetup from './components/UserProfileSetup';
import MyLocationForm from './components/MyLocationForm';
import ProfileEdit from './components/ProfileEdit';
import ScheduledLocationsList from './components/ScheduledLocationsList';
import LocationDetailModal from './components/LocationDetailModal';
import GroupManagement from './components/GroupManagement';
import { Location, MapPoint, UserProfile, UserLocation, Group } from './types';
import { addLocation, getLocations, deleteLocation } from './services/locationService';
import { getGroup } from './services/groupService';
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
  const { user, loading: authLoading } = useAuth();
  const mapImageUrl = `${process.env.PUBLIC_URL}/libefes_map.png`;
  const [locations, setLocations] = useState<Location[]>([]);
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [userProfiles, setUserProfiles] = useState<{ [uid: string]: UserProfile }>({});
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [locationTypeFilter, setLocationTypeFilter] = useState<'all' | 'current' | 'scheduled'>('all');
  const [groupFilter, setGroupFilter] = useState<'all' | 'group' | 'no-group'>('all');
  const [myLocationFormData, setMyLocationFormData] = useState<{ position: MapPoint; currentLocation?: UserLocation } | null>(null);
  const [showScheduledLocationsList, setShowScheduledLocationsList] = useState(false);
  const [selectedLocationDetail, setSelectedLocationDetail] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

  useEffect(() => {
    if (user) {
      loadLocations();
    }
  }, [user]);

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
        // グループ情報も読み込み
        if (profile.groupId) {
          loadCurrentGroup(profile.groupId);
        }
      } else {
        setShowProfileSetup(true);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setShowProfileSetup(true);
    }
  };

  const loadCurrentGroup = async (groupId: string) => {
    try {
      const group = await getGroup(groupId);
      setCurrentGroup(group);
    } catch (error) {
      console.error('Failed to load group:', error);
      // グループが見つからない場合は無視
    }
  };

  const loadUserLocations = async () => {
    try {
      const allUserLocations = await getActiveUserLocations();
      
      // 7日以上古い位置情報をフィルタリング
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentLocations = allUserLocations.filter(location => {
        if (!location.date) return false;
        const locationDate = new Date(location.date + 'T00:00:00');
        return locationDate >= sevenDaysAgo;
      });
      
      setUserLocations(recentLocations);
      
      // ユーザープロフィールを個別に取得
      const profiles: { [uid: string]: UserProfile } = { ...userProfiles }; // 既存のプロフィールを保持
      const uniqueUserIds = Array.from(new Set(recentLocations.map(ul => ul.userId)));
      
      // プロフィール取得を並列化してパフォーマンス改善
      const profilePromises = uniqueUserIds
        .filter(userId => !profiles[userId])
        .map(async (userId) => {
          try {
            const profile = await getUserProfile(userId);
            if (profile) {
              return { userId, profile };
            }
          } catch (error) {
            // エラーを静かに処理（削除されたユーザーなど）
            console.debug(`Profile not found for user ${userId}`);
          }
          return null;
        });
      
      const profileResults = await Promise.all(profilePromises);
      profileResults.forEach(result => {
        if (result) {
          profiles[result.userId] = result.profile;
        }
      });
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
    location?: string; 
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
        if (data.location && data.location.trim()) {
          updateData.location = data.location.trim();
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
        if (data.location && data.location.trim()) {
          newLocationData.location = data.location.trim();
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


  const handleUserLocationClick = (userLocation: UserLocation) => {
    // 現在は詳細モーダルで表示
    setSelectedLocationDetail(userLocation);
  };

  const handleLocationEdit = (userLocation: UserLocation) => {
    setSelectedLocationDetail(null);
    setMyLocationFormData({
      position: { x: userLocation.x, y: userLocation.y },
      currentLocation: userLocation
    });
  };

  const handleLocationDetailDelete = async (userLocation: UserLocation) => {
    try {
      setLoading(true);
      await deleteUserLocation(userLocation.id);
      await loadUserLocations();
      setSelectedLocationDetail(null);
    } catch (error) {
      console.error('Failed to delete location:', error);
      alert('位置情報の削除に失敗しました');
    } finally {
      setLoading(false);
    }
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

  const handleScheduledLocationDelete = async (userLocation: UserLocation) => {
    try {
      setLoading(true);
      await deleteUserLocation(userLocation.id);
      await loadUserLocations();
    } catch (error) {
      console.error('Failed to delete scheduled location:', error);
      alert('予定地の削除に失敗しました');
    } finally {
      setLoading(false);
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
  if (groupFilter !== 'all') {
    filteredUserLocations = filteredUserLocations.filter(loc => {
      const userProfile = userProfiles[loc.userId];
      if (groupFilter === 'group') {
        return userProfile?.groupId === currentUserProfile?.groupId && currentUserProfile?.groupId;
      } else if (groupFilter === 'no-group') {
        return !userProfile?.groupId;
      }
      return true;
    });
  }

  // 認証状態の読み込み中
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md text-center max-w-sm sm:max-w-md mx-auto">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  // 未ログイン状態
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md text-center max-w-sm sm:max-w-md mx-auto">
          <img 
            src={`${process.env.PUBLIC_URL}/img_header_logo.png`} 
            alt="リベ大お金の勉強フェス2025" 
            className="w-full max-w-xs mx-auto mb-4"
          />
          <h1 className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-green-600 to-orange-600 bg-clip-text text-transparent">
            ともどこ
          </h1>
          <p className="text-sm text-gray-500 mb-4">友達どこにいる？</p>
          <p className="text-gray-600 mb-6">利用するにはログインが必要です</p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-orange-50">
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center mb-4 py-2">
          <div className="flex items-center gap-1 sm:gap-3 flex-1 min-w-0">
            <img 
              src={`${process.env.PUBLIC_URL}/img_header_logo.png`} 
              alt="リベ大お金の勉強フェス2025" 
              className="h-6 sm:h-8 lg:h-10 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-lg lg:text-2xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-orange-600 bg-clip-text text-transparent leading-tight">
                ともどこ
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block leading-tight">友達どこにいる？</p>
            </div>
          </div>
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
                  {currentGroup && (
                    <p className="text-xs text-green-600">
                      👥 {currentGroup.name} ({currentGroup.memberCount}人)
                    </p>
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
                    onClick={() => setShowGroupManagement(true)}
                    className="text-xs text-purple-600 hover:text-purple-700 underline"
                  >
                    👥 グループ
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
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold">フィルタ</h3>
              <button
                onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {isFilterCollapsed ? '📋' : '📋'}
                <span className="ml-1 text-xs">
                  {isFilterCollapsed ? '展開' : '折りたたみ'}
                </span>
              </button>
            </div>
            
            {/* クイックフィルター - 常に表示 */}
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => {
                  setLocationTypeFilter('scheduled');
                  setSelectedUser(user?.uid || '');
                }}
                className="px-3 py-1 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full text-xs hover:from-orange-500 hover:to-orange-600 transition-all shadow-sm"
              >
                📅 自分の予定
              </button>
              <button
                onClick={() => {
                  setLocationTypeFilter('current');
                  setSelectedUser('');
                  setGroupFilter('all');
                }}
                className="px-3 py-1 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-full text-xs hover:from-blue-500 hover:to-blue-600 transition-all shadow-sm"
              >
                📍 現在地一覧
              </button>
              {currentGroup && (
                <button
                  onClick={() => {
                    setGroupFilter('group');
                    setLocationTypeFilter('all');
                    setSelectedUser('');
                  }}
                  className="px-3 py-1 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-full text-xs hover:from-purple-500 hover:to-purple-600 transition-all shadow-sm"
                >
                  👥 {currentGroup.name}
                </button>
              )}
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setSelectedDate(today);
                  setLocationTypeFilter('all');
                }}
                className="px-3 py-1 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full text-xs hover:from-green-500 hover:to-green-600 transition-all shadow-sm"
              >
                📅 今日
              </button>
              <button
                onClick={() => {
                  setLocationTypeFilter('all');
                  setGroupFilter('all');
                  setSelectedDate('');
                  setSelectedTime('');
                  setSelectedUser('');
                }}
                className="px-3 py-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-full text-xs hover:from-gray-500 hover:to-gray-600 transition-all shadow-sm"
              >
                クリア
              </button>
            </div>
            
            {/* 詳細フィルター - 折りたたみ可能 */}
            {!isFilterCollapsed && (
              <div className="space-y-3 border-t pt-3">
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">グループ</label>
                    <select
                      value={groupFilter}
                      onChange={(e) => setGroupFilter(e.target.value as 'all' | 'group' | 'no-group')}
                      className="w-full p-2 border border-gray-300 rounded text-xs sm:text-sm touch-manipulation"
                    >
                      <option value="all">すべて表示</option>
                      {currentGroup && (
                        <option value="group">👥 {currentGroup.name}のみ</option>
                      )}
                      <option value="no-group">グループ未参加のみ</option>
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
                </div>
              </div>
            )}
          </div>
        )}

        {/* 地図表示 - 大きく表示 */}
        <div className="bg-white rounded-lg shadow-md p-2 sm:p-4 mb-4">
          <h2 className="text-md sm:text-lg font-bold mb-2 sm:mb-4 bg-gradient-to-r from-blue-600 via-green-600 to-orange-600 bg-clip-text text-transparent">
            リベ大フェス会場マップ
          </h2>
          <MapViewer
            mapImageUrl={mapImageUrl}
            locations={filteredLocations}
            userLocations={filteredUserLocations}
            userProfiles={userProfiles}
            currentUserId={user?.uid}
            onMapClick={handleMapClick}
            onUserLocationClick={handleUserLocationClick}
          />
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
            onLocationDelete={handleScheduledLocationDelete}
            onClose={() => setShowScheduledLocationsList(false)}
          />
        )}

        {/* 位置詳細モーダル */}
        {selectedLocationDetail && (
          <LocationDetailModal
            userLocation={selectedLocationDetail}
            userProfile={userProfiles[selectedLocationDetail.userId]}
            isCurrentUser={selectedLocationDetail.userId === user?.uid}
            onEdit={() => handleLocationEdit(selectedLocationDetail)}
            onDelete={() => handleLocationDetailDelete(selectedLocationDetail)}
            onClose={() => setSelectedLocationDetail(null)}
          />
        )}

        {/* グループ管理ダイアログ */}
        {showGroupManagement && currentUserProfile && (
          <GroupManagement
            currentUser={currentUserProfile}
            currentGroup={currentGroup}
            onGroupChange={(group) => {
              setCurrentGroup(group);
              // プロフィール情報も更新
              setCurrentUserProfile(prev => prev ? { ...prev, groupId: group?.id } : null);
              loadUserLocations(); // グループ変更後にユーザー位置を再読み込み
            }}
            onClose={() => setShowGroupManagement(false)}
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
