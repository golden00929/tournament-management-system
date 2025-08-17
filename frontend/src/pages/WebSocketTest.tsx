/**
 * WebSocket Reconnection Test Page
 * Comprehensive testing interface for WebSocket reconnection functionality
 * Includes stress testing, connection simulation, and real-time monitoring
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { useTournamentWebSocket } from '../hooks/useWebSocketReconnection';
import ConnectionStatusWidget from '../components/WebSocket/ConnectionStatusWidget';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  duration: number;
  actions: Array<{
    delay: number;
    action: 'disconnect' | 'connect' | 'send_message' | 'force_reconnect';
    params?: any;
  }>;
}

interface TestResult {
  scenario: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  events: Array<{
    timestamp: Date;
    type: string;
    description: string;
    success: boolean;
  }>;
  metrics: {
    totalReconnections: number;
    averageReconnectionTime: number;
    messagesLost: number;
    messagesSent: number;
  };
}

const WebSocketTest: React.FC = () => {
  const [tournamentId, setTournamentId] = useState('test-tournament-123');
  const [autoTest, setAutoTest] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<TestResult | null>(null);
  const [messageText, setMessageText] = useState('Test message from WebSocket test page');
  const [messageCount, setMessageCount] = useState(0);
  const [receivedMessages, setReceivedMessages] = useState<Array<{ timestamp: Date; content: string }>>([]);

  const tournamentSocket = useTournamentWebSocket(tournamentId);

  // Test scenarios
  const testScenarios: TestScenario[] = [
    {
      id: 'basic-reconnection',
      name: '기본 재연결 테스트',
      description: '연결 해제 후 자동 재연결 테스트',
      duration: 30000,
      actions: [
        { delay: 5000, action: 'disconnect' },
        { delay: 10000, action: 'send_message', params: { text: 'Message during disconnection' } },
        { delay: 15000, action: 'connect' }
      ]
    },
    {
      id: 'multiple-reconnections',
      name: '다중 재연결 테스트',
      description: '여러 번의 연결 해제/재연결 시뮬레이션',
      duration: 60000,
      actions: [
        { delay: 10000, action: 'disconnect' },
        { delay: 15000, action: 'connect' },
        { delay: 25000, action: 'force_reconnect' },
        { delay: 35000, action: 'disconnect' },
        { delay: 45000, action: 'connect' }
      ]
    },
    {
      id: 'message-queuing',
      name: '메시지 큐잉 테스트',
      description: '연결 해제 중 메시지 전송 및 큐잉 확인',
      duration: 45000,
      actions: [
        { delay: 5000, action: 'disconnect' },
        { delay: 10000, action: 'send_message', params: { text: 'Queued message 1' } },
        { delay: 15000, action: 'send_message', params: { text: 'Queued message 2' } },
        { delay: 20000, action: 'send_message', params: { text: 'Queued message 3' } },
        { delay: 30000, action: 'connect' }
      ]
    },
    {
      id: 'stress-test',
      name: '스트레스 테스트',
      description: '빠른 연결/해제 반복 및 메시지 폭탄',
      duration: 90000,
      actions: [
        { delay: 5000, action: 'disconnect' },
        { delay: 7000, action: 'connect' },
        { delay: 12000, action: 'force_reconnect' },
        { delay: 15000, action: 'disconnect' },
        { delay: 17000, action: 'connect' },
        { delay: 20000, action: 'send_message', params: { text: 'Stress message', repeat: 10 } }
      ]
    }
  ];

  // Set up message listeners
  useEffect(() => {
    const unsubscribeFromMessages = tournamentSocket.subscribeToMatches((message) => {
      setReceivedMessages(prev => [...prev, {
        timestamp: new Date(),
        content: `Match update: ${JSON.stringify(message)}`
      }]);
    });

    tournamentSocket.on('test-message', (data: any) => {
      setReceivedMessages(prev => [...prev, {
        timestamp: new Date(),
        content: `Test message: ${data.text}`
      }]);
    });

    return unsubscribeFromMessages;
  }, [tournamentSocket]);

  // Auto-join tournament when connected
  useEffect(() => {
    if (tournamentSocket.isConnected) {
      tournamentSocket.joinTournament();
    }
  }, [tournamentSocket.isConnected, tournamentSocket]);

  const runTestScenario = async (scenario: TestScenario) => {
    const testResult: TestResult = {
      scenario: scenario.name,
      startTime: new Date(),
      status: 'running',
      events: [],
      metrics: {
        totalReconnections: 0,
        averageReconnectionTime: 0,
        messagesLost: 0,
        messagesSent: 0
      }
    };

    setCurrentTest(testResult);
    
    const addEvent = (type: string, description: string, success: boolean = true) => {
      testResult.events.push({
        timestamp: new Date(),
        type,
        description,
        success
      });
      setCurrentTest({ ...testResult });
    };

    addEvent('scenario-start', `시나리오 시작: ${scenario.description}`);

    try {
      for (const action of scenario.actions) {
        await new Promise(resolve => setTimeout(resolve, action.delay));

        switch (action.action) {
          case 'disconnect':
            addEvent('disconnect', '연결 해제 실행');
            tournamentSocket.disconnect();
            break;

          case 'connect':
            addEvent('connect', '연결 시도');
            const connected = await tournamentSocket.connect();
            addEvent('connect-result', connected ? '연결 성공' : '연결 실패', connected);
            break;

          case 'force_reconnect':
            addEvent('force-reconnect', '강제 재연결 실행');
            tournamentSocket.forceReconnect();
            break;

          case 'send_message':
            const repeatCount = action.params?.repeat || 1;
            for (let i = 0; i < repeatCount; i++) {
              const sent = tournamentSocket.emit('test-message', {
                text: action.params?.text || messageText,
                index: i,
                timestamp: Date.now()
              });
              testResult.metrics.messagesSent++;
              if (!sent) testResult.metrics.messagesLost++;
              
              if (repeatCount > 1) {
                await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between messages
              }
            }
            addEvent('send-message', `메시지 전송: ${repeatCount}개`, true);
            break;
        }
      }

      // Wait for scenario completion
      await new Promise(resolve => setTimeout(resolve, scenario.duration - scenario.actions.reduce((sum, a) => sum + a.delay, 0)));

      testResult.status = 'completed';
      testResult.endTime = new Date();
      addEvent('scenario-end', '시나리오 완료');

    } catch (error) {
      testResult.status = 'failed';
      testResult.endTime = new Date();
      addEvent('scenario-error', `시나리오 실패: ${error}`, false);
    }

    setTestResults(prev => [...prev, testResult]);
    setCurrentTest(null);
  };

  const sendTestMessage = () => {
    const sent = tournamentSocket.emit('test-message', {
      text: messageText,
      timestamp: Date.now(),
      messageNumber: messageCount + 1
    });
    
    if (sent) {
      setMessageCount(prev => prev + 1);
    }
  };

  const clearLogs = () => {
    setReceivedMessages([]);
    setTestResults([]);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        WebSocket 재연결 테스트
      </Typography>

      {/* Connection Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <ConnectionStatusWidget 
            tournamentId={tournamentId} 
            position="relative"
            showDetails={true}
          />
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Test Configuration */}
        <Grid sx={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                테스트 설정
              </Typography>
              
              <TextField
                fullWidth
                label="Tournament ID"
                value={tournamentId}
                onChange={(e) => setTournamentId(e.target.value)}
                margin="normal"
                size="small"
              />

              <TextField
                fullWidth
                label="테스트 메시지"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                margin="normal"
                size="small"
                multiline
                rows={2}
              />

              <FormControlLabel
                control={
                  <Switch 
                    checked={autoTest} 
                    onChange={(e) => setAutoTest(e.target.checked)}
                  />
                }
                label="자동 테스트 모드"
                sx={{ mt: 1 }}
              />

              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => tournamentSocket.connect()}
                  disabled={tournamentSocket.isConnected || tournamentSocket.isConnecting}
                  startIcon={<PlayIcon />}
                  size="small"
                >
                  연결
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => tournamentSocket.disconnect()}
                  disabled={!tournamentSocket.isConnected}
                  startIcon={<StopIcon />}
                  size="small"
                >
                  해제
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => tournamentSocket.forceReconnect()}
                  startIcon={<RefreshIcon />}
                  size="small"
                >
                  재연결
                </Button>
                <Button
                  variant="outlined"
                  onClick={sendTestMessage}
                  startIcon={<MessageIcon />}
                  size="small"
                >
                  메시지 전송
                </Button>
              </Box>

              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                전송된 메시지: {messageCount}개
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Scenarios */}
        <Grid sx={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                테스트 시나리오
              </Typography>
              
              {testScenarios.map((scenario) => (
                <Accordion key={scenario.id} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                        {scenario.name}
                      </Typography>
                      <Chip 
                        label={`${scenario.duration / 1000}초`} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {scenario.description}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => runTestScenario(scenario)}
                      disabled={currentTest !== null}
                      startIcon={<PlayIcon />}
                    >
                      실행
                    </Button>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Current Test Progress */}
        {currentTest && (
          <Grid sx={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  실행 중: {currentTest.scenario}
                </Typography>
                <LinearProgress sx={{ mb: 2 }} />
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  최근 이벤트:
                </Typography>
                
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {currentTest.events.slice(-5).map((event, index) => (
                    <Alert 
                      key={index} 
                      severity={event.success ? 'info' : 'error'} 
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="caption">
                        {formatTime(event.timestamp)} - {event.description}
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Received Messages */}
        <Grid sx={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  수신된 메시지 ({receivedMessages.length})
                </Typography>
                <Tooltip title="로그 지우기">
                  <IconButton onClick={clearLogs} size="small">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {receivedMessages.slice(-10).reverse().map((message, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <MessageIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={message.content}
                        secondary={formatTime(message.timestamp)}
                      />
                    </ListItem>
                  ))}
                  {receivedMessages.length === 0 && (
                    <ListItem>
                      <ListItemText 
                        primary="수신된 메시지가 없습니다"
                        secondary="메시지를 전송하거나 테스트를 실행해보세요"
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Results */}
        <Grid sx={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                테스트 결과 ({testResults.length})
              </Typography>
              
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {testResults.map((result, index) => (
                  <Accordion key={index} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                          {result.scenario}
                        </Typography>
                        <Chip 
                          label={result.status} 
                          size="small" 
                          color={result.status === 'completed' ? 'success' : result.status === 'failed' ? 'error' : 'warning'}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" gutterBottom>
                        <strong>시작:</strong> {formatTime(result.startTime)}
                      </Typography>
                      {result.endTime && (
                        <Typography variant="body2" gutterBottom>
                          <strong>종료:</strong> {formatTime(result.endTime)}
                        </Typography>
                      )}
                      <Typography variant="body2" gutterBottom>
                        <strong>전송 메시지:</strong> {result.metrics.messagesSent}개 | 
                        <strong> 손실:</strong> {result.metrics.messagesLost}개
                      </Typography>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Typography variant="body2" gutterBottom>
                        <strong>이벤트 로그:</strong>
                      </Typography>
                      {result.events.slice(-3).map((event, eventIndex) => (
                        <Typography key={eventIndex} variant="caption" display="block">
                          {formatTime(event.timestamp)} - {event.description}
                        </Typography>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                ))}
                
                {testResults.length === 0 && (
                  <Typography variant="body2" color="textSecondary">
                    테스트 결과가 없습니다. 시나리오를 실행해보세요.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default WebSocketTest;