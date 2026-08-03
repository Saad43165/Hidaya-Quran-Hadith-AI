import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Fetch current state immediately
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected !== false);
    }).catch(() => {});

    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable can be null while checking — treat null as online
      // Only mark offline when isConnected is explicitly false
      setIsOnline(state.isConnected !== false);
    });

    return () => unsubscribe();
  }, []);

  return { isOnline };
}
