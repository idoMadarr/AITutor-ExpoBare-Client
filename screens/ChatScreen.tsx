import { ChatMessage, ChatType, RoleType } from '@/models/Chat';
import { playTTS } from '@/utils/voice';
import axios from 'axios';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useState } from 'react';
import {
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

const ChatScreen = () => {
  const { width } = useWindowDimensions();

  const [chat, setChat] = useState<ChatType>([]);
  const [recognizing, setRecognizing] = useState(false);
  const [userMessage, setUserMessage] = useState<string>('');

  const updateUserMessage = (val: string) => {
    setUserMessage(val);
  };

  useSpeechRecognitionEvent('start', () => setRecognizing(true));
  useSpeechRecognitionEvent('end', () => setRecognizing(false));
  useSpeechRecognitionEvent('result', event => {
    setUserMessage(event.results[0]?.transcript);
  });
  useSpeechRecognitionEvent('error', event => {
    console.log('error code:', event.error, 'error message:', event.message);
  });

  const onSend = async () => {
    try {
      const newMessage = new ChatMessage(userMessage, RoleType.USER);

      setChat(prevState => prevState.concat(newMessage));

      const payload = { content: userMessage, history: chat };

      const response = await axios.post('http://192.168.2.77:8000/chat', {
        // const response = await axios.post('http://10.0.2.2:8000/chat', {
        message: userMessage,
        history: chat,
      });
      console.log(response.data, 'response data');

      await playTTS(
        `http://192.168.2.77:8000${response.data.agent_audio_message}`,
      );

      const agentMessage = new ChatMessage(
        response.data.agent_text_message,
        RoleType.AGENT,
      );
      setChat(prevState => prevState.concat(agentMessage));

      setUserMessage('');
      console.log(payload);
    } catch (error) {
      console.log(error);
    }
  };

  const handleStart = async () => {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      console.warn('Permissions not granted', result);
      return;
    }
    // Start speech recognition
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
  };
  console.log(chat);

  return (
    <View style={styles.screen}>
      <TextInput
        value={userMessage}
        onChangeText={updateUserMessage}
        placeholder={'Ask Something...'}
        style={[styles.input, { width: width * 0.85 }]}
      />
      <Pressable onPress={onSend} style={styles.button}>
        <Text style={{ color: 'white' }}>Send</Text>
      </Pressable>

      {!recognizing ? (
        <Button title='Start' onPress={handleStart} />
      ) : (
        <Button
          title='Stop'
          onPress={() => ExpoSpeechRecognitionModule.stop()}
        />
      )}

      <FlatList
        data={chat}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => {
          console.log(item, 'asd');

          return (
            <View
              style={{
                paddingHorizontal: '4%',
                justifyContent: 'center',
                minHeight: 40,
                width: width * 0.85,
                marginVertical: 2,
                borderRadius: 8,
                borderBottomWidth: 1,
                backgroundColor: 'red',
              }}
            >
              <Text style={{ fontSize: 10, alignSelf: 'flex-end' }}>
                {item.role === RoleType.AGENT ? 'agent' : 'user'}
              </Text>
              <Text style={{ color: 'black' }}>{item.content}</Text>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    height: 50,
    marginTop: 20,
    borderWidth: 1,
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: '4%',
  },
  button: {
    marginVertical: '5%',
    backgroundColor: 'blue',
    width: 150,
    height: 40,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;
