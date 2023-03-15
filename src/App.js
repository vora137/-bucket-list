import React, { useCallback, useState, useEffect } from 'react';
import { StatusBar, Dimensions, Alert, Pressable, Text } from 'react-native';
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
  font-size: 30px;
  font-weight: 600;
  color: ${({ theme }) => theme.main};
  align-self: center;
  letter-spacing: 10px;
  margin: 0px 20px; /* y축 x축 */
`;

const List = styled.ScrollView`
  flex: 1;
  width: ${({ width }) => width - 40}px;
`;
const AllItemDelBtn = ({ width, onPress, title }) => {
  return (
    <Pressable
      style={{
        backgroundColor: '#666',
        width: width - 40,
        margin: 5,
        borderRadius: 10, // 객체리터럴 > 단위 안붙여도됨
      }}
      onPress={onPress}
    >
      <Text style={{ textAlign: 'center', padding: 5, color: '#fff' }}>
        {title}
      </Text>
    </Pressable>
  );
};

SplashScreen.preventAutoHideAsync();

const App = () => {
  const width = Dimensions.get('window').width;

  const [isReady, setIsReady] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState({});
  const [completedCnt, setCompletedCnt] = useState(0); // 상태변수를 만드는 함수 .

  // 데이터 저장
  const _saveTasks = async tasks => {
    try {
      setCompletedCnt(
        Object.values(tasks).filter(item => item.completed).length, //완료건수
      );
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
      setTasks(tasks);
    } catch (e) {
      console.error(e);
    }
  };
  // 데이터 불러오기
  const _loadTasks = async () => {
    try {
      let loadedTasks = await AsyncStorage.getItem('tasks');
      loadedTasks = JSON.parse(loadedTasks) || {};
      setTasks(loadedTasks);
      // 초기에도 완료항목 카운트 되게 지정
      setCompletedCnt(
        Object.values(loadedTasks).filter(item => item.completed).length,
      );
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
    const currentTasks = { ...tasks }; //Object.assign({},tasks);

    Alert.alert('', '삭제하시겠습니까?', [
      {
        text: '아니오',
        onPress() {
          console.log('아니오');
        },
      },
      {
        text: '예',
        onPress() {
          console.log('예');
          delete currentTasks[id];
          _saveTasks(currentTasks);
        },
      },
    ]);
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
    console.log(`변경된문자열:${newTask}`);
  };

  // 입력취소
  const _onBlur = () => {
    setNewTask('');
  };

  // 전체삭제
  const _delAll = () => {
    const currentTasks = { ...tasks };
    if (Object.values(currentTasks).filter(item => item.completed).length < 1) {
      Alert.alert('', '완료 항목이 없습니다', [{ text: '확인' }]);
      return;
    }

    Alert.alert(
      '[주의]',
      `완료항목 ${completedCnt}건 있습니다. \n 전체삭제 하시겠습니까?`,
      [
        { text: '아니오', onPress: () => {} },
        {
          text: '예',
          onPress() {
            const currentTasks = { ...tasks };
            Object.keys(currentTasks)
              .filter(key => currentTasks[key].completed)
              .forEach(key => delete currentTasks[key]);
            _saveTasks(currentTasks);
          },
        },
      ],
    );
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
        <AllItemDelBtn
          onPress={() => {
            _delAll();
          }}
          title={`완료항목(${completedCnt})건 전체 삭제`}
          width={width}
        />
      </Container>
    </ThemeProvider>
  );
};
export default App;
