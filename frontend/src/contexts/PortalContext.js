import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getParentPortalOverview,
  getStudentPortalOverview,
  parentPortalAccess,
  studentPortalAccess,
} from '../services/api';

const STORAGE_KEY = 'portal_session';
const PortalContext = createContext(null);

const readStoredSession = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

export const PortalProvider = ({ children }) => {
  const [portalSession, setPortalSession] = useState(readStoredSession);
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (portalSession) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(portalSession));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [portalSession]);

  const refreshPortalData = useCallback(async (session = portalSession) => {
    if (!session?.studentId || !session?.role) {
      setPortalData(null);
      return null;
    }

    setLoading(true);
    try {
      const response = session.role === 'student'
        ? await getStudentPortalOverview(session.studentId)
        : await getParentPortalOverview(session.studentId);

      setPortalData(response.data.data);
      return response.data.data;
    } finally {
      setLoading(false);
    }
  }, [portalSession]);

  useEffect(() => {
    if (portalSession?.studentId) {
      refreshPortalData(portalSession).catch(() => {
        setPortalSession(null);
        setPortalData(null);
      });
    }
  }, [portalSession, refreshPortalData]);

  const loginStudent = async (credentials) => {
    const response = await studentPortalAccess(credentials);
    const payload = response.data.data;
    const nextSession = {
      role: 'student',
      studentId: payload.student.student_id,
      name: payload.student.student_name,
    };

    setPortalSession(nextSession);
    setPortalData(payload);
    return payload;
  };

  const loginParent = async (credentials) => {
    const response = await parentPortalAccess(credentials);
    const payload = response.data.data;
    const nextSession = {
      role: 'parent',
      studentId: payload.student.student_id,
      name: payload.student.student_name,
    };

    setPortalSession(nextSession);
    setPortalData(payload);
    return payload;
  };

  const logoutPortal = () => {
    setPortalSession(null);
    setPortalData(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(() => ({
    portalSession,
    portalData,
    loading,
    loginStudent,
    loginParent,
    logoutPortal,
    refreshPortalData,
    isPortalAuthenticated: !!portalSession,
  }), [portalSession, portalData, loading, refreshPortalData]);

  return (
    <PortalContext.Provider value={value}>
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = () => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within PortalProvider');
  }
  return context;
};