import AISpeakingCircle from '@/components/AISpeakingCircle/AISpeakingCircle';
import ChatItemMessage from '@/components/ChatMessage/ChatMessage';
import TextElement from '@/components/Reuseable/TextElement';
import { ChatMessage, ChatType, RoleType } from '@/models/Chat';
import { Colors } from '@/utils/palette';
import useKeyboard from '@/utils/useKeyboard';
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from 'axios';
import { useAudioPlayer } from 'expo-audio';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// const connect = Config.MOBILE_SERVER;
const connect = 'https://smalltalk-fastapi-openai.onrender.com';
const MAX_HISTORY = 6;

export default function Index() {
  const { width } = useWindowDimensions();
  const { keyboardHeight } = useKeyboard();
  const player = useAudioPlayer(undefined);

  const [chat, setChat] = useState<ChatType>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [userMessage, setUserMessage] = useState<string>('');
  const [amplitude, setAmplitude] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const recognitionRef = useRef('');
  const flatlistRef = useRef<FlatList>(null);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(chat.length === 0 ? 1 : 0, { duration: 1400 });
  }, [chat]);

  const smoothedAmplitude = useRef(0);

  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', status => {
      if (status.didJustFinish) {
        setIsSpeaking(false);
        setAmplitude(0);
      }
      if (status.playing) {
        setIsSpeaking(true);
      }
    });

    return () => sub.remove();
  }, [player]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isSpeaking) {
      interval = setInterval(() => {
        amplitudeFunc();
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSpeaking]);

  const amplitudeFunc = useCallback(() => {
    const smoothingFactor = 0.1;
    const target = Math.random(); // fake amplitude

    const prev = smoothedAmplitude.current;
    const next = prev + (target - prev) * smoothingFactor;

    smoothedAmplitude.current = next;
    setAmplitude(next);
  }, []);

  const updateUserMessage = (val: string) => {
    setUserMessage(val);
  };

  useSpeechRecognitionEvent('start', () => {
    setIsRecording(true);
  });
  useSpeechRecognitionEvent('end', () => {
    onSend(recognitionRef.current, 'speech');
    setIsRecording(false);
  });
  useSpeechRecognitionEvent('result', event => {
    const text = event.results[0]?.transcript;
    recognitionRef.current = text;
  });
  useSpeechRecognitionEvent('error', event => {
    setIsRecording(false);
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

      flatlistRef.current?.scrollToEnd({ animated: true });

      const audioTrack = `${connect}${response.data.agent_audio_message}`;

      if (player.playing) {
        player.pause();
      }
      player.replace({ uri: audioTrack });
      player.play();
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    if (isLoading) return;

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

  const controllerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withTiming(-keyboardHeight.value, {
          duration: 250,
        }),
      },
    ],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle={'light-content'} backgroundColor={Colors.black} />
      <Pressable
        onPress={() => {
          setChat([]);
        }}
        style={({ pressed }) => [
          styles.menuItem,
          {
            opacity: pressed ? 0.6 : 1,
          },
        ]}
      >
        <Entypo name='plus' size={22} color={'white'} />
        <TextElement>New</TextElement>
      </Pressable>
      <AISpeakingCircle
        amplitude={amplitude}
        isSpeaking={isSpeaking}
        newChat={chat.length === 0}
      />

      <Animated.View style={[styles.helloText, textAnimatedStyle]}>
        <TextElement cStyles={styles.textAlign}>
          {
            'Hi, I’m your AI Tutor, ready to help you learn, practice, and improve at your own pace.'
          }
        </TextElement>
      </Animated.View>

      <FlatList
        ref={flatlistRef}
        data={chat}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ alignSelf: 'center' }}
        ItemSeparatorComponent={() => <View style={styles.seperator} />}
        renderItem={({ item }) => {
          const isUser = item.role === RoleType.USER;
          return <ChatItemMessage item={item} isUser={isUser} />;
        }}
      />

      <Animated.View style={[styles.controller, controllerAnimatedStyle]}>
        <TextInput
          value={userMessage}
          onChangeText={updateUserMessage}
          placeholder={isRecording ? 'Recording...' : 'Ask Something...'}
          cursorColor={'white'}
          placeholderTextColor={isRecording ? 'red' : 'white'}
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
            {isLoading ? (
              <ActivityIndicator size={'small'} color={Colors.black} />
            ) : (
              <Ionicons name={'send'} size={18} color={Colors.black} />
            )}
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
            {isLoading ? (
              <ActivityIndicator size={'small'} color={Colors.black} />
            ) : (
              <MaterialIcons
                name={'keyboard-voice'}
                size={24}
                color={Colors.black}
              />
            )}
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
  menuItem: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
  },
  helloText: {
    width: Dimensions.get('window').width * 0.8,
    position: 'absolute',
    bottom: '48%',
    alignSelf: 'center',
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
  textAlign: {
    textAlign: 'center',
    opacity: 0.6,
  },
});
