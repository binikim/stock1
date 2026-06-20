import { useState, useEffect, useCallback } from 'react';

/**
 * LocalStorage에 상태를 자동으로 저장하고 로드하는 커스텀 훅
 * @param key LocalStorage에 저장할 키 이름
 * @param initialValue 초기 값
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // 1. 초기값 설정: LocalStorage에 값이 있으면 로드하고 없으면 initialValue 사용
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // 2. 상태 업데이트 및 LocalStorage 동기화 함수
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // value가 함수인 경우 지원 (useState처럼)
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // 3. 다른 탭/윈도우에서의 로컬 스토리지 변경 사항 동기화 (Storage Event)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error) {
          console.warn(`Error parsing external storage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}
