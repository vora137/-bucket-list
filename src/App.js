import React, { useCallback, useState, useEffect } from 'react';
import { StatusBar, Dimensions, Alert } from 'react-native';
import styled, { ThemeProvider } from 'styled-components/native';
import { theme } from './theme';
import Input from './components/Input';
import Task from './components/Task';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${({ theme }) => theme.background};
  align-items: center;
  justify-content: flex-start;
`;

const Title = styled.Text`
  font-size: 40px;
  font-weight: 600;
  color: ${({ theme }) => theme.main};
  align-self: center;
  margin: 0px 20px;
`;

const List = styled.ScrollView`
  flex: 1;
  width: ${({ width }) => width - 40}px;
`;

SplashScreen.preventAutoHideAsync();

const App = () => {
  const width = Dimensions.get('window').width;

  const [isReady, setIsReady] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState({});

  // 데이터 저장
  const _saveTasks = async tasks => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
      setTasks(tasks);
    } catch (e) {
      console.error(e);
    }
  };
  // 데이터 불러오기
  const _loadTasks = async () => {
    try {
      const loadedTasks = await AsyncStorage.getItem('tasks');
      setTasks(JSON.parse(loadedTasks || '{}'));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    async function prepare() {
      try {
        await _loadTasks();
      } catch (e) {
        console.error(e);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, []);
  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  // 추가
  const _addTask = () => {
    const ID = Date.now().toString();
    const newTaskObject = {
      [ID]: { id: ID, text: newTask, completed: false },
    };

    setNewTask('');
    _saveTasks({ ...tasks, ...newTaskObject });
  };

  // 삭제
  const _deleteTask = id => {
    const currentTasks = Object.assign({}, tasks);
    delete currentTasks[id];
    _saveTasks(currentTasks);
  };

  // 완료
  const _toggleTask = id => {
    const currentTasks = Object.assign({}, tasks);
    currentTasks[id]['completed'] = !currentTasks[id]['completed'];
    _saveTasks(currentTasks);
  };

  // 수정
  const _updateTask = item => {
    const currentTasks = Object.assign({}, tasks);
    currentTasks[item.id] = item;
    _saveTasks(currentTasks);
  };

  const _handleTextChange = text => {
    setNewTask(text);
  };

  // 입력취소
  const _onBlur = () => {
    setNewTask('');
  };
  return (
    <ThemeProvider theme={theme}>
      <Container onLayout={onLayoutRootView}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.background}
        />
        <Title>버킷 리스트</Title>
        <Input
          value={newTask}
          placeholder="+ 항목추가"
          onChangeText={_handleTextChange} // 수정
          onSubmitEditing={_addTask} // 완료
          onBlur={_onBlur} // 포커스 잃었을때
        />
        <List width={width}>
          {Object.values(tasks)
            .reverse()
            .map(item => (
              <Task
                key={item.id}
                item={item}
                deleteTask={_deleteTask}
                toggleTask={_toggleTask}
                updateTask={_updateTask}
              />
            ))}
        </List>
      </Container>
    </ThemeProvider>
  );
};
export default App;
