import { useCallback, useEffect, useState } from 'react';
export function useBrowserPermissions() {
  const [location, setLocation] = useState('unknown');
  const [notifications, setNotifications] = useState('unknown');
  const refresh = useCallback(() => {
    setNotifications('Notification' in window ? Notification.permission : 'unsupported');
  }, []);
  useEffect(() => {
    let active = true;
    let permission;
    refresh();
    if (!navigator.geolocation) setLocation('unsupported');
    else if (navigator.permissions?.query) navigator.permissions.query({ name: 'geolocation' }).then(value => { if (!active) return; permission = value; setLocation(value.state); value.onchange = () => setLocation(value.state); }).catch(() => { if (active) setLocation('unknown'); });
    window.addEventListener('focus', refresh);
    return () => { active = false; if (permission) permission.onchange = null; window.removeEventListener('focus', refresh); };
  }, [refresh]);
  async function askNotifications() {
    if (!('Notification' in window)) return 'unsupported';
    const result = await Notification.requestPermission();
    setNotifications(result); return result;
  }
  function askLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { setLocation('unsupported'); reject(new Error('Geolocation is not supported.')); return; }
      navigator.geolocation.getCurrentPosition(() => { setLocation('granted'); resolve(); }, error => { if (error.code === 1) setLocation('denied'); reject(new Error('Location access was denied or could not be obtained.')); }, { timeout: 10000, maximumAge: 0 });
    });
  }
  return { location, notifications, askNotifications, askLocation };
}

