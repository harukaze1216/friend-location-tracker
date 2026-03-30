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
import { deleteField } from 'firebase/firestore';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  const { user, loading: authLoading } = useAuth();
  const mapImageUrl = '/libefes_map.png';
  const [locations, setLocations] = useState<Location[]>([]);
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [userProfiles, setUserProfiles] = useState<{ [uid: string]: UserProfile }>({});
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [currentGroups, setCurrentGroups] = useState<Group[]>([]);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [locationTypeFilter, setLocationTypeFilter] = useState<'all' | 'current' | 'scheduled'>('all');
  const [groupFilter, setGroupFilter] = useState<'all' | 'no-group' | string>('all');
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
        if (profile.groupIds && profile.groupIds.length > 0) {
          loadCurrentGroups(profile.groupIds);
        } else if (profile.groupId) {
          const groupIds = [profile.groupId];
          loadCurrentGroups(groupIds);
          updateUserProfile(user.uid, {
            groupIds: groupIds,
            groupId: deleteField()
          } as any).catch(error => console.error('データ移行エラー:', error));
        }
      } else {
        setShowProfileSetup(true);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setShowProfileSetup(true);
    }
  };

  const loadCurrentGroups = async (groupIds: string[]) => {
    try {
      const groupPromises = groupIds.map(id => getGroup(id));
      const groups = await Promise.all(groupPromises);
      const validGroups = groups.filter(group => group !== null) as Group[];
      setCurrentGroups(validGroups);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const loadUserLocations = async () => {
    try {
      const allUserLocations = await getActiveUserLocations();

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentLocations = allUserLocations.filter(location => {
        if (!location.date) return false;
        const locationDate = new Date(location.date + 'T00:00:00');
        return locationDate >= sevenDaysAgo;
      });

      setUserLocations(recentLocations);

      const profiles: { [uid: string]: UserProfile } = { ...userProfiles };
      const uniqueUserIds = Array.from(new Set(recentLocations.map(ul => ul.userId)));

      const profilePromises = uniqueUserIds
        .filter(userId => !profiles[userId])
        .map(async (userId) => {
          try {
            const profile = await getUserProfile(userId);
            if (profile) {
              return { userId, profile };
            }
          } catch (error) {
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
      if (groupFilter === 'no-group') {
        return !userProfile?.groupIds?.length && !userProfile?.groupId;
      } else {
        const userGroupIds = userProfile?.groupIds || (userProfile?.groupId ? [userProfile.groupId] : []);
        return userGroupIds.includes(groupFilter);
      }
    });
  }

  // 認証状態の読み込み中
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="glass rounded-2xl shadow-xl p-8 text-center max-w-sm mx-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin mx-auto mb-5"></div>
          <p className="text-slate-500 font-medium">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  // 未ログイン状態
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="glass rounded-2xl shadow-xl p-8 sm:p-10 text-center max-w-sm mx-4">
          <img
            src="/img_header_logo.png"
            alt="リベ大お金の勉強フェス2025"
            className="w-full max-w-[240px] mx-auto mb-6"
          />
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-1 bg-gradient-to-r from-indigo-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">
            ともどこ
          </h1>
          <p className="text-slate-400 text-sm mb-6">友達どこにいる?</p>
          <p className="text-slate-500 mb-8 text-sm">利用するにはログインが必要です</p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        {/* Header */}
        <header className="flex justify-between items-center py-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img
              src="/img_header_logo.png"
              alt="リベ大お金の勉強フェス2025"
              className="h-7 sm:h-9 lg:h-11 flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl lg:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent leading-tight">
                ともどこ
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block leading-tight">友達どこにいる?</p>
            </div>
          </div>
          <LoginButton />
        </header>

        {/* Profile Card */}
        {currentUserProfile?.profileCompleted && (
          <div className="glass rounded-2xl shadow-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUserProfile.avatarUrl ? (
                  <img
                    src={currentUserProfile.avatarUrl}
                    alt={currentUserProfile.displayName}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-indigo-100"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm sm:text-base ring-2 ring-indigo-100">
                    {currentUserProfile.displayName.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-800">{currentUserProfile.displayName}</h2>
                  {currentUserProfile.libeCityName && (
                    <p className="text-xs text-slate-500">{currentUserProfile.libeCityName}</p>
                  )}
                  {currentGroups.length > 0 && (
                    <p className="text-xs text-emerald-600 font-medium mt-0.5">
                      {currentGroups.length}グループ参加中
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowScheduledLocationsList(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                  >
                    予定
                    {userLocations.filter(ul => ul.locationType === 'scheduled' && ul.userId === user?.uid).length > 0 && (
                      <span className="bg-amber-500 text-white text-[10px] rounded-full w-4.5 h-4.5 min-w-[18px] flex items-center justify-center font-bold">
                        {userLocations.filter(ul => ul.locationType === 'scheduled' && ul.userId === user?.uid).length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowGroupManagement(true)}
                    className="px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    グループ
                  </button>
                  <button
                    onClick={() => setShowProfileEdit(true)}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    編集
                  </button>
                </div>
                <p className="text-[11px] text-indigo-500 hidden sm:block">地図をクリックして位置を設定</p>
                <p className="text-[11px] text-indigo-500 sm:hidden">タップして位置設定</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {currentUserProfile?.profileCompleted && (
          <div className="glass rounded-2xl shadow-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-slate-700">フィルタ</h3>
              <button
                onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
              >
                <svg className={`w-4 h-4 transition-transform ${isFilterCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {isFilterCollapsed ? '詳細' : '閉じる'}
              </button>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setLocationTypeFilter('scheduled');
                  setSelectedUser(user?.uid || '');
                }}
                className="px-3 py-1.5 bg-amber-500 text-white rounded-full text-xs font-medium hover:bg-amber-600 transition-colors shadow-sm"
              >
                自分の予定
              </button>
              <button
                onClick={() => {
                  setLocationTypeFilter('current');
                  setSelectedUser('');
                  setGroupFilter('all');
                }}
                className="px-3 py-1.5 bg-indigo-500 text-white rounded-full text-xs font-medium hover:bg-indigo-600 transition-colors shadow-sm"
              >
                現在地一覧
              </button>
              {currentGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => {
                    setGroupFilter(group.id);
                    setLocationTypeFilter('all');
                    setSelectedUser('');
                  }}
                  className="px-3 py-1.5 bg-purple-500 text-white rounded-full text-xs font-medium hover:bg-purple-600 transition-colors shadow-sm"
                >
                  {group.name}
                </button>
              ))}
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setSelectedDate(today);
                  setLocationTypeFilter('all');
                }}
                className="px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-medium hover:bg-emerald-600 transition-colors shadow-sm"
              >
                今日
              </button>
              <button
                onClick={() => {
                  setLocationTypeFilter('all');
                  setGroupFilter('all');
                  setSelectedDate('');
                  setSelectedTime('');
                  setSelectedUser('');
                }}
                className="px-3 py-1.5 bg-slate-400 text-white rounded-full text-xs font-medium hover:bg-slate-500 transition-colors shadow-sm"
              >
                クリア
              </button>
            </div>

            {/* Detailed Filters */}
            {!isFilterCollapsed && (
              <div className="mt-4 pt-4 border-t border-slate-200/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">位置タイプ</label>
                    <select
                      value={locationTypeFilter}
                      onChange={(e) => setLocationTypeFilter(e.target.value as 'all' | 'current' | 'scheduled')}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
                    >
                      <option value="all">すべて表示</option>
                      <option value="current">現在地のみ</option>
                      <option value="scheduled">予定地のみ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">グループ</label>
                    <select
                      value={groupFilter}
                      onChange={(e) => setGroupFilter(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
                    >
                      <option value="all">すべて表示</option>
                      {currentGroups.map((group) => (
                        <option key={group.id} value={group.id}>{group.name}のみ</option>
                      ))}
                      <option value="no-group">グループ未参加のみ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">日付</label>
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
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
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">時間</label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
                    >
                      <option value="">すべての時間</option>
                      {Array.from(new Set([...locations.map(l => l.time), ...userLocations.map(ul => ul.time)])).sort().map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">ユーザー</label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
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

        {/* Map */}
        <div className="glass rounded-2xl shadow-lg p-3 sm:p-5 mb-4">
          <h2 className="text-base sm:text-lg font-bold mb-3 bg-gradient-to-r from-indigo-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">
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

        {/* Location List */}
        {currentUserProfile?.profileCompleted && (
          <div className="glass rounded-2xl shadow-lg p-4 sm:p-5 mb-6">
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

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 glass-dark flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 shadow-2xl flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin"></div>
              <span className="text-slate-600 font-medium text-sm">読み込み中...</span>
            </div>
          </div>
        )}

        {/* Modals */}
        {showProfileSetup && user && (
          <UserProfileSetup
            user={user}
            onProfileComplete={handleProfileComplete}
          />
        )}

        {showProfileEdit && currentUserProfile && (
          <ProfileEdit
            currentProfile={currentUserProfile}
            onSave={handleProfileEdit}
            onCancel={() => setShowProfileEdit(false)}
          />
        )}

        {myLocationFormData && (
          <MyLocationForm
            position={myLocationFormData.position}
            currentLocation={myLocationFormData.currentLocation}
            onSubmit={handleMyLocationSubmit}
            onDelete={myLocationFormData.currentLocation ? handleUserLocationDelete : undefined}
            onCancel={() => setMyLocationFormData(null)}
          />
        )}

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

        {showGroupManagement && currentUserProfile && (
          <GroupManagement
            currentUser={currentUserProfile}
            currentGroups={currentGroups}
            onGroupsChange={(groups) => {
              setCurrentGroups(groups);
              const groupIds = groups.map(g => g.id);
              setCurrentUserProfile(prev => prev ? { ...prev, groupIds } : null);
              setUserProfiles({});
              loadUserLocations();
              loadUserProfile();
            }}
            onClose={() => setShowGroupManagement(false)}
          />
        )}

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
