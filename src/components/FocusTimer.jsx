import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

// 悬浮按钮动画
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(52, 152, 219, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(52, 152, 219, 0);
  }
`;

// 悬浮按钮容器
const FloatingButton = styled.button`
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  transition: all 0.3s ease;
  z-index: 1000;
  animation: ${pulse} 2s infinite;

  &:hover {
    transform: scale(1.1) rotate(15deg);
    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
  }

  &.active {
    background: linear-gradient(135deg, #e74c3c, #c0392b);
    animation: none;
  }
`;

// 专注面板容器
const FocusPanel = styled.div`
  position: fixed;
  bottom: 110px;
  right: 30px;
  width: 320px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  padding: 24px;
  z-index: 999;
  opacity: ${props => props.$isVisible ? 1 : 0};
  transform: ${props => props.$isVisible ? 'translateY(0)' : 'translateY(20px)'};
  transition: all 0.3s ease;
  pointer-events: ${props => props.$isVisible ? 'auto' : 'none'};
`;

// 面板头部
const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #95a5a6;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: #f8f9fa;
    color: #2c3e50;
  }
`;

// 计时器显示
const TimerDisplay = styled.div`
  text-align: center;
  margin-bottom: 20px;
`;

const TimerTime = styled.div`
  font-size: 48px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 12px;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
`;

const TimerProgress = styled.div`
  width: 100%;
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => props.$isActive ? '#3498db' : '#95a5a6'};
  width: ${props => props.$progress}%;
  transition: width 0.5s ease, background 0.3s ease;

  &.focus-mode {
    background: linear-gradient(90deg, #3498db, #2980b9);
  }

  &.break-mode {
    background: linear-gradient(90deg, #27ae60, #229954);
  }
`;

// 模式指示器
const ModeIndicator = styled.div`
  text-align: center;
  font-size: 12px;
  color: #666;
  padding: 6px 12px;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 20px;
  display: inline-block;
  margin-left: auto;
  margin-right: auto;
`;

// 时长选择器
const DurationSelector = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 20px;
`;

const DurationButton = styled.button`
  padding: 8px 16px;
  border: 2px solid ${props => props.$active ? '#3498db' : '#ddd'};
  background: ${props => props.$active ? '#3498db' : 'white'};
  color: ${props => props.$active ? 'white' : '#333'};
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3498db;
    background: ${props => props.$active ? '#3498db' : '#f8f9fa'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// 控制按钮
const ControlButtons = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
`;

const ControlButton = styled.button`
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$primary ? '#3498db' : '#ecf0f1'};
  color: ${props => props.$primary ? 'white' : '#333'};
  min-width: 100px;

  &:hover:not(:disabled) {
    background: ${props => props.$primary ? '#2980b9' : '#bdc3c7'};
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// 统计面板
const StatsSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
`;

const StatsTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
  text-align: center;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 12px 8px;
  background: #f8f9fa;
  border-radius: 8px;
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #3498db;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: #666;
  font-weight: 500;
  line-height: 1.2;
`;

const FocusTimer = () => {
  const { state, dispatch } = useAuth();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [showPanel, setShowPanel] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const remainingTimeRef = useRef(25 * 60);

  // 初始化或重置计时器
  const initializeTimer = useCallback(() => {
    const duration = isBreak ? 5 : selectedDuration;
    const totalSeconds = duration * 60;
    setTimeLeft(totalSeconds);
    remainingTimeRef.current = totalSeconds;
    setProgress(100);
    startTimeRef.current = null;
  }, [isBreak, selectedDuration]);

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 发送通知
  const sendNotification = (message) => {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification('Focus Mode', {
        body: message,
        icon: '/favicon.ico'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Focus Mode', {
            body: message,
            icon: '/favicon.ico'
          });
        }
      });
    }
  };

  // 播放提醒声音
  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    audio.play().catch(err => console.warn('Failed to play notification sound:', err));
  };

  // 计时结束处理
  const handleTimerComplete = useCallback(() => {
    playNotificationSound();
    setIsActive(false);

    if (isBreak) {
      sendNotification('Break time is over! Let\'s start a new focus session.');
      setIsBreak(false);
      initializeTimer();
    } else {
      sendNotification('Focus session completed! Time to take a break.');

      // 记录专注时长 - 确保使用正确的方法
      if (state.user) {
        try {
          const session = {
            userId: state.user.id,
            duration: selectedDuration,
            timestamp: new Date().toISOString(),
            completed: true
          };

          // 使用dispatch直接更新状态
          dispatch({ type: 'ADD_FOCUS_SESSION', payload: session });
          console.log('Focus session saved:', session);
        } catch (error) {
          console.error('Error saving focus session:', error);
        }

        // 自动进入休息模式
        setIsBreak(true);
        initializeTimer();
      }
    }
  }, [isBreak, selectedDuration, state.user, dispatch, initializeTimer]);

  // 计时器逻辑 - 修复时间计算问题
  useEffect(() => {
    if (isActive) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const totalSeconds = isBreak ? 5 * 60 : selectedDuration * 60;
        const remaining = Math.max(0, totalSeconds - elapsed);

        setTimeLeft(remaining);

        // 计算进度
        const newProgress = (remaining / totalSeconds) * 100;
        setProgress(Math.max(0, newProgress));

        if (remaining === 0) {
          handleTimerComplete();
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, isBreak, selectedDuration, handleTimerComplete]);

  // 启动/暂停计时器
  const toggleTimer = () => {
    if (!isActive) {
      // 如果计时器已结束，重新初始化
      if (timeLeft === 0) {
        initializeTimer();
      }
      setIsActive(true);
    } else {
      setIsActive(false);
      startTimeRef.current = null;
    }
  };

  // 重置计时器
  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    initializeTimer();
  };

  // 切换时长 - 修复实时更新问题
  const changeDuration = (duration) => {
    if (!isActive) {
      setSelectedDuration(duration);
      // 如果不在休息模式，立即更新显示的时间
      if (!isBreak) {
        const totalSeconds = duration * 60;
        setTimeLeft(totalSeconds);
        remainingTimeRef.current = totalSeconds;
        setProgress(100);
      }
    }
  };

  // 切换面板显示
  const togglePanel = () => {
    setShowPanel(!showPanel);
  };

  // 当面板显示时初始化计时器
  useEffect(() => {
    if (showPanel) {
      initializeTimer();
    }
  }, [showPanel, initializeTimer]);

  return (
    <>
      {/* 悬浮按钮 */}
      <FloatingButton
        className={isActive ? 'active' : ''}
        onClick={togglePanel}
        title="Focus Mode"
      >
        {isActive ? '⏸️' : '🎯'}
      </FloatingButton>

      {/* 专注面板 */}
      <FocusPanel $isVisible={showPanel}>
        <PanelHeader>
          <PanelTitle>Focus Mode</PanelTitle>
          <CloseButton onClick={togglePanel}>×</CloseButton>
        </PanelHeader>

        <TimerDisplay>
          <TimerTime>{formatTime(timeLeft)}</TimerTime>

          <TimerProgress>
            <ProgressFill
              $progress={progress}
              $isActive={isActive}
              className={isBreak ? 'break-mode' : 'focus-mode'}
            />
          </TimerProgress>
        </TimerDisplay>

        <ModeIndicator>
          {isBreak ? '🧘 Break Mode' : '📚 Focus Mode'}
        </ModeIndicator>

        {!isBreak && (
          <DurationSelector>
            <DurationButton
              $active={selectedDuration === 15}
              onClick={() => changeDuration(15)}
              disabled={isActive}
            >
              15 min
            </DurationButton>
            <DurationButton
              $active={selectedDuration === 25}
              onClick={() => changeDuration(25)}
              disabled={isActive}
            >
              25 min
            </DurationButton>
            <DurationButton
              $active={selectedDuration === 45}
              onClick={() => changeDuration(45)}
              disabled={isActive}
            >
              45 min
            </DurationButton>
          </DurationSelector>
        )}

        <ControlButtons>
          <ControlButton
            $primary={true}
            onClick={toggleTimer}
          >
            {isActive ? '⏸️ Pause' : '▶️ Start'}
          </ControlButton>
          <ControlButton
            onClick={resetTimer}
            disabled={!isActive && timeLeft === (isBreak ? 5 : selectedDuration) * 60}
          >
            🔄 Reset
          </ControlButton>
        </ControlButtons>

        {/* 统计信息 */}
        <StatsSection>
          <StatsTitle>📊 Focus Statistics</StatsTitle>
          <StatsGrid>
            <StatItem>
              <StatValue>{state.focusHistory?.filter(s =>
                new Date(s.timestamp) >= new Date(new Date().setHours(0, 0, 0, 0))
              ).reduce((sum, s) => sum + s.duration, 0) || 0}</StatValue>
              <StatLabel>Today<br />Minutes</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{state.focusHistory?.filter(s =>
                new Date(s.timestamp) >= new Date(new Date().setDate(new Date().getDate() - 7))
              ).reduce((sum, s) => sum + s.duration, 0) || 0}</StatValue>
              <StatLabel>This Week<br />Minutes</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{state.focusHistory?.length || 0}</StatValue>
              <StatLabel>Total<br />Sessions</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{state.focusHistory?.reduce((sum, s) => sum + s.duration, 0) || 0}</StatValue>
              <StatLabel>Total<br />Minutes</StatLabel>
            </StatItem>
          </StatsGrid>
        </StatsSection>
      </FocusPanel>
    </>
  );
};

export default FocusTimer;