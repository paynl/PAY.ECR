import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { format } from 'date-fns';

export interface LogEntry {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  tag: string;
  line: string;
}

interface LogContextType {
  logs: LogEntry[];
  appendLog: (message: string) => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

interface LogProviderProps {
  children: ReactNode;
  maxLogs?: number;
}

const formatLogs = (message: string): LogEntry => {
  return {
    timestamp: Date.now(),
    level: 'info',
    message,
    tag: 'PAY.ECR-example',
    line: `[${format(new Date(), 'HH:mm:ss')}] ${message}`,
  };
};

export const LogProvider: React.FC<LogProviderProps> = ({ children, maxLogs = 500 }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsRef = useRef(logs);

  // Keep ref in sync with state
  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  const appendLog = useCallback(
    (message: string) => {
      setLogs(prev => {
        const updated = [...prev, formatLogs(message)];
        // Trim if exceeds max
        if (updated.length > maxLogs) {
          return updated.slice(-maxLogs);
        }
        return updated;
      });
    },
    [maxLogs],
  );

  const value: LogContextType = {
    logs,
    appendLog
  };

  return <LogContext.Provider value={value}>{children}</LogContext.Provider>;
};

export const useLogs = (): LogContextType => {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error('useLogs must be used within a LogProvider');
  }
  return context;
};