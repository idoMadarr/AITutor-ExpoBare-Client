import { useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

const useKeyboard = () => {
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => {
        keyboardHeight.value = e.endCoordinates.height;
      },
    );

    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        keyboardHeight.value = 0;
      },
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return {
    keyboardHeight: keyboardHeight,
  };
};

export default useKeyboard;
