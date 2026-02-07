import AISpeakingCircle from '@/components/AISpeakingCircle/AISpeakingCircle';
import TextElement from '@/components/Reuseable/TextElement';
import { ChatMessage, ChatType, RoleType } from '@/models/Chat';
import { Colors } from '@/utils/palette';
import useKeyboard from '@/utils/useKeyboard';
import { playTTS } from '@/utils/voice';
import axios from 'axios';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Keyboard,
  Pressable,
  StatusBar,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Config from 'react-native-config';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const connect = Config.MOBILE_SERVER;
const MAX_HISTORY = 6;

export default function Index() {
  const { width } = useWindowDimensions();
  const { keyboardHeight } = useKeyboard();

  const [chat, setChat] = useState<ChatType>([]);
  const [recognizing, setRecognizing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userMessage, setUserMessage] = useState<string>('');
  const [amplitude, setAmplitude] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const recognitionRef = useRef('');
  const flatlistRef = useRef<FlatList>(null);

  const updateUserMessage = (val: string) => {
    setUserMessage(val);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withTiming(-keyboardHeight.value, {
          duration: 250,
        }),
      },
    ],
  }));

  useSpeechRecognitionEvent('start', () => setRecognizing(true));
  useSpeechRecognitionEvent('end', () => {
    setRecognizing(false);
    onSend(recognitionRef.current, 'speech');
  });
  useSpeechRecognitionEvent('result', event => {
    const text = event.results[0]?.transcript;
    recognitionRef.current = text;
  });
  useSpeechRecognitionEvent('error', event => {
    console.log('error code:', event.error, 'error message:', event.message);
  });

  const onSend = async (message: string, mode: 'speech' | 'type') => {
    if (mode === 'speech' && !recognitionRef.current.length) return;
    if (mode === 'type' && !userMessage.length) return;

    try {
      Keyboard.dismiss();
      setIsLoading(true);

      const newMessage = new ChatMessage(message, RoleType.USER);
      setChat(prevState => prevState.concat(newMessage));

      const trimmedHistory = chat.slice(-MAX_HISTORY);
      const response = await axios.post(`${connect}/chat`, {
        message: message,
        history: trimmedHistory,
      });

      const agentMessage = new ChatMessage(
        response.data.agent_text_message,
        RoleType.AGENT,
      );
      setChat(prevState => prevState.concat(agentMessage));
      setUserMessage('');
      recognitionRef.current = '';

      setIsLoading(false);

      let smoothedAmplitude = 0;
      const smoothingFactor = 0.1;

      flatlistRef.current?.scrollToEnd({ animated: true });
      setIsSpeaking(true);
      await playTTS(
        `${connect}${response.data.agent_audio_message}`,
        rawAmp => {
          smoothedAmplitude += (rawAmp - smoothedAmplitude) * smoothingFactor;
          setAmplitude(smoothedAmplitude);
        },
      );
      setIsSpeaking(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
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
      continuous: true,
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle={'light-content'} backgroundColor={Colors.black} />
      <AISpeakingCircle amplitude={amplitude} isSpeaking={isSpeaking} />

      <FlatList
        ref={flatlistRef}
        data={chat}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ alignSelf: 'center' }}
        ItemSeparatorComponent={() => <View style={styles.seperator} />}
        renderItem={({ item }) => {
          const isUser = item.role === RoleType.USER;

          const customStyles = {
            ...styles.labelRole,
            alignSelf: isUser ? 'flex-start' : 'flex-end',
            backgroundColor: isUser ? Colors.secondary : Colors.primary,
          };

          return (
            <View style={styles.itemContainer}>
              <TextElement cStyles={customStyles}>
                {item.role === RoleType.AGENT ? 'Agent' : 'User'}
              </TextElement>
              <TextElement
                cStyles={{ alignSelf: isUser ? 'flex-start' : 'flex-end' }}
              >
                {item.content}
              </TextElement>
            </View>
          );
        }}
      />

      <Animated.View style={[styles.controller, animatedStyle]}>
        <TextInput
          value={userMessage}
          onChangeText={updateUserMessage}
          placeholder={'Ask Something...'}
          cursorColor={'white'}
          placeholderTextColor={'white'}
          style={[styles.input, { width: width * 0.65 }]}
        />

        {userMessage.length > 0 ? (
          <Pressable
            onPress={() => {
              if (isLoading) return;
              onSend(userMessage, 'type');
            }}
            style={({ pressed }) => [
              styles.pushToTalk,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <TextElement>{`Send`}</TextElement>
          </Pressable>
        ) : (
          <Pressable
            onPressIn={handleStart}
            onPressOut={ExpoSpeechRecognitionModule.stop}
            style={({ pressed }) => [
              styles.pushToTalk,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <TextElement>{`${recognizing ? 'Stop' : 'Push'}`}</TextElement>
          </Pressable>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: Dimensions.get('window').height * 0.02,
    backgroundColor: Colors.black,
  },
  controller: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: Dimensions.get('window').width * 0.9,
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    overflow: 'hidden',
    paddingHorizontal: '3%',
  },
  itemContainer: {
    paddingHorizontal: '4%',
    justifyContent: 'center',
    minHeight: 40,
    width: Dimensions.get('window').width * 0.85,
    marginVertical: 2,
    borderRadius: 8,
    // borderBottomWidth: 1,
    // borderColor: '#ccc',
    paddingVertical: '4%',
  },
  labelRole: {
    fontSize: 10,
    paddingVertical: '1%',
    paddingHorizontal: '4%',
    borderRadius: 4,
    color: 'white',
    marginBottom: '4%',
  },
  input: {
    height: 50,
    color: 'white',
  },
  button: {
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
  },
  pushToTalk: {
    width: 40,
    height: 40,
    backgroundColor: Colors.tertiary,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  seperator: {
    width: Dimensions.get('window').width * 0.85,
    height: 1,
    backgroundColor: Colors.white,
    opacity: 0.5,
  },
});
