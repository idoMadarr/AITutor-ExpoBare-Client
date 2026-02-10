import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import TextElement from './TextElement';

interface ButtonElementPropsType {
  title?: string;
  onPress?(): void;
  onPressIn?(): void;
  onPressOut?(): void;
  cStyle?: {};
  children?: React.ReactNode;
}

const ButtonElement: React.FC<ButtonElementPropsType> = ({
  title,
  onPress = undefined,
  onPressIn = undefined,
  onPressOut = undefined,
  cStyle = {},
  children = undefined,
}) => {
  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed ? 0.6 : 1 },
        cStyle,
      ]}
    >
      {children ? children : null}
      {title ? <TextElement>{title}</TextElement> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 75,
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ButtonElement;
